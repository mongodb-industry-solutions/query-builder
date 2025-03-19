// simplified-opt-to-webtemplate.js
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const express = require('express');
const multer = require('multer');
const cors = require('cors');

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Create Express app
const app = express();
const PORT = process.env.PORT || 3100; // Changed from 3000 to avoid conflicts

// Enable CORS
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Debug flag
const DEBUG = process.env.DEBUG === 'true';

/**
 * Simple debug logger
 */
function debug(msg, obj) {
  if (DEBUG) {
    console.log(`DEBUG: ${msg}`);
    if (obj) console.log(JSON.stringify(obj, null, 2));
  }
}

/**
 * Convert XML OPT to Web Template JSON - simplified approach
 * @param {string} xmlContent - The XML content of the OPT file
 * @returns {Promise<object>} - The resulting Web Template JSON
 */
async function convertOPTtoWebTemplate(xmlContent) {
  try {
    // Use a simpler parser configuration
    const parser = new xml2js.Parser({
      explicitArray: false,
      normalizeTags: false,
      mergeAttrs: true
    });
    
    const result = await parser.parseStringPromise(xmlContent);
    debug("Parsed XML result", result.template);
    
    if (!result.template) {
      throw new Error('Invalid OPT format: missing template element');
    }
    
    const template = result.template;
    
    // Extract basic template information
    const templateId = extractStringValue(template, 'template_id.value') || 'unknown_template';
    const concept = extractStringValue(template, 'concept') || 'Unknown Template';
    const language = extractStringValue(template, 'language.code_string') || 'en';
    
    // Extract version information
    let semVer = '';
    let version = '';
    
    if (template.description && template.description.other_details) {
      const details = Array.isArray(template.description.other_details) 
        ? template.description.other_details 
        : [template.description.other_details];
        
      for (const detail of details) {
        if (detail.id === 'sem_ver') {
          semVer = extractStringValue(detail, 'value') || '';
        }
        if (detail.id === 'build_uid') {
          version = '1.0.0'; // Default version if build_uid exists
        }
      }
    }
    
    // Get root node information
    const definition = template.definition || {};
    const rootNodeId = extractStringValue(definition, 'node_id') || 'at0000';
    const rootRmType = extractStringValue(definition, 'rm_type_name') || 'COMPOSITION';
    
    // Process term definitions
    const termDefs = processTermDefinitions(definition);
    debug("Extracted term definitions", termDefs);
    
    // Build the basic web template structure
    const webTemplate = {
      templateId: templateId,
      semVer: semVer,
      version: version,
      defaultLanguage: language,
      languages: [language],
      tree: {
        id: safeString(concept).toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        name: concept,
        localizedName: concept,
        rmType: rootRmType,
        nodeId: rootNodeId,
        min: 1,
        max: 1,
        localizedNames: { [language]: concept },
        localizedDescriptions: {},
        aqlPath: '',
        children: []
      }
    };
    
    // Add root node description if available
    if (termDefs[rootNodeId] && termDefs[rootNodeId].description) {
      webTemplate.tree.localizedDescriptions[language] = termDefs[rootNodeId].description;
    }
    
    // Process root level attributes
    if (definition.attributes) {
      const attributes = Array.isArray(definition.attributes) 
        ? definition.attributes 
        : [definition.attributes];
        
      await processAttributesSimple(attributes, webTemplate.tree.children, termDefs, '', language);
    }
    
    return webTemplate;
  } catch (error) {
    console.error('Error in conversion:', error);
    throw error;
  }
}

/**
 * Safely extract a string value from a nested path in an object
 * @param {Object} obj - The object to extract from
 * @param {string} path - The dot-notation path to the value
 * @returns {string|null} - The extracted string or null
 */
function extractStringValue(obj, path) {
  try {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return null;
      }
      current = current[part];
    }
    
    if (current === null || current === undefined) {
      return null;
    }
    
    if (Array.isArray(current)) {
      return current[0] ? String(current[0]) : null;
    }
    
    return String(current);
  } catch (e) {
    return null;
  }
}

/**
 * Process term definitions into a usable format
 * @param {Object} definition - The template definition
 * @returns {Object} - Map of term definitions by code
 */
function processTermDefinitions(definition) {
  const termDefs = {};
  
  if (!definition.term_definitions) {
    return termDefs;
  }
  
  const termDefinitions = Array.isArray(definition.term_definitions) 
    ? definition.term_definitions 
    : [definition.term_definitions];
    
  for (const termDef of termDefinitions) {
    if (!termDef || !termDef.code) continue;
    
    const code = Array.isArray(termDef.code) ? termDef.code[0] : termDef.code;
    if (!code) continue;
    
    if (!termDef.items) continue;
    
    const items = Array.isArray(termDef.items) ? termDef.items : [termDef.items];
    
    termDefs[code] = {};
    
    for (const item of items) {
      if (!item || !item.id) continue;
      
      const id = Array.isArray(item.id) ? item.id[0] : item.id;
      if (!id) continue;
      
      let value = item.value;
      if (Array.isArray(value)) {
        value = value[0];
      }
      
      if (id === 'text') {
        termDefs[code].text = value;
      } else if (id === 'description') {
        termDefs[code].description = value;
      } else if (id === 'comment') {
        termDefs[code].comment = value;
      }
    }
  }
  
  return termDefs;
}

/**
 * Simplified attribute processing
 * @param {Array|Object} attributes - The attributes to process
 * @param {Array} parentChildren - The children array to populate
 * @param {Object} termDefs - Term definitions
 * @param {string} parentPath - The parent AQL path
 * @param {string} language - The language code
 */
async function processAttributesSimple(attributes, parentChildren, termDefs, parentPath, language) {
  const attrList = Array.isArray(attributes) ? attributes : [attributes];
  
  for (const attr of attrList) {
    if (!attr || !attr.children) continue;
    
    const rmAttributeName = extractStringValue(attr, 'rm_attribute_name') || '';
    
    const children = Array.isArray(attr.children) ? attr.children : [attr.children];
    
    for (const child of children) {
      if (!child || !child.rm_type_name) continue;
      
      const rmType = extractStringValue(child, 'rm_type_name');
      if (!rmType) continue;
      
      const nodeId = extractStringValue(child, 'node_id') || '';
      
      // Get term definition for this node
      const termDef = termDefs[nodeId] || {};
      
      // Get node name from term definition or nodeId
      const nodeName = termDef.text || nodeId || rmType;
      
      // Calculate min/max occurrences
      let min = 0;
      let max = 1;
      
      if (child.occurrences) {
        const occurrences = Array.isArray(child.occurrences) ? child.occurrences[0] : child.occurrences;
        
        if (occurrences) {
          min = parseInt(extractStringValue(occurrences, 'lower') || '0', 10);
          
          const upperValue = extractStringValue(occurrences, 'upper');
          if (upperValue === 'unbounded' || upperValue === '*') {
            max = -1;
          } else {
            max = parseInt(upperValue || '1', 10);
          }
        }
      }
      
      // Build the AQL path
      let aqlPath = '';
      if (parentPath) {
        aqlPath = `${parentPath}/`;
      }
      
      if (rmAttributeName) {
        aqlPath += rmAttributeName;
        
        if (nodeId) {
          if (nodeId.startsWith('openEHR') && nodeName) {
            // Format for archetype nodes with names
            aqlPath += `[${nodeId},'${nodeName}']`;
          } else if (nodeId.startsWith('at')) {
            // Format for at-coded nodes
            aqlPath += `[${nodeId}]`;
          }
        }
      }
      
      // Create the node
      const node = {
        id: safeString(nodeId || nodeName).toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        name: nodeName,
        localizedName: nodeName,
        rmType: rmType,
        nodeId: nodeId,
        min: min,
        max: max,
        localizedNames: {},
        localizedDescriptions: {},
        aqlPath: aqlPath,
        children: []
      };
      
      // Add localized names and descriptions
      node.localizedNames[language] = nodeName;
      
      if (termDef.description) {
        node.localizedDescriptions[language] = termDef.description;
      }
      
      // Add inputs for data types that need them
      if (['DV_TEXT', 'DV_CODED_TEXT', 'DV_QUANTITY', 'DV_DATE_TIME', 'DV_DATE', 'DV_BOOLEAN'].includes(rmType)) {
        node.inputs = getInputsForType(rmType);
      }
      
      // Set inContext flag if needed
      if (rmAttributeName === 'context' || 
          ['language', 'territory', 'composer', 'category'].includes(node.id)) {
        node.inContext = true;
      }
      
      // Process child attributes
      if (child.attributes) {
        await processAttributesSimple(
          child.attributes, 
          node.children, 
          termDefs, 
          aqlPath, 
          language
        );
      }
      
      // Add the node to parent's children
      parentChildren.push(node);
    }
  }
}

/**
 * Get input configuration for a data type
 * @param {string} rmType - The RM type name
 * @returns {Array} - Input configuration
 */
function getInputsForType(rmType) {
  switch (rmType) {
    case 'DV_TEXT':
      return [{ type: 'TEXT' }];
    case 'DV_CODED_TEXT':
      return [
        { suffix: 'code', type: 'TEXT' },
        { suffix: 'value', type: 'TEXT' }
      ];
    case 'DV_QUANTITY':
      return [
        { suffix: 'magnitude', type: 'DECIMAL' },
        { suffix: 'units', type: 'TEXT' }
      ];
    case 'DV_DATE_TIME':
      return [{ type: 'DATETIME' }];
    case 'DV_DATE':
      return [{ type: 'DATE' }];
    case 'DV_BOOLEAN':
      return [{ type: 'BOOLEAN' }];
    default:
      return [];
  }
}

/**
 * Ensure a value is a string and not null/undefined
 * @param {any} value - The value to convert
 * @returns {string} - String representation of the value
 */
function safeString(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

// API endpoint to convert uploaded OPT file to Web Template
app.post('/api/convert', upload.single('optFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const xmlContent = fs.readFileSync(filePath, 'utf8');

    // Convert the OPT to Web Template
    const webTemplate = await convertOPTtoWebTemplate(xmlContent);
    
    // Cleanup uploaded file
    fs.unlinkSync(filePath);

    res.json(webTemplate);
  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ error: 'Failed to convert file', details: error.message });
  }
});

// API endpoint to convert OPT content to Web Template
app.post('/api/convert-content', async (req, res) => {
  try {
    const { optContent } = req.body;
    
    if (!optContent) {
      return res.status(400).json({ error: 'No OPT content provided' });
    }

    // Convert the OPT to Web Template
    const webTemplate = await convertOPTtoWebTemplate(optContent);
    
    res.json(webTemplate);
  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ error: 'Failed to convert content', details: error.message });
  }
});

// HTML page for the conversion tool
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Export for testing
module.exports = {
  convertOPTtoWebTemplate
};