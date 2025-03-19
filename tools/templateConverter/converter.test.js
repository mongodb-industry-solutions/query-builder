// __tests__/converter.test.js
const fs = require('fs');
const path = require('path');
const { convertOPTtoWebTemplate } = require('../opt-to-webtemplate');

describe('OPT to Web Template Converter', () => {
  test('should correctly convert a simple OPT file', async () => {
    // Create a simple OPT XML for testing
    const sampleOPT = `
      <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <template xmlns="http://schemas.openehr.org/v1">
        <language>
          <terminology_id>
            <value>ISO_639-1</value>
          </terminology_id>
          <code_string>en</code_string>
        </language>
        <description>
          <lifecycle_state>unmanaged</lifecycle_state>
          <other_details id="sem_ver">1.0.0</other_details>
        </description>
        <template_id>
          <value>test_template</value>
        </template_id>
        <concept>Test Template</concept>
        <definition>
          <rm_type_name>COMPOSITION</rm_type_name>
          <node_id>at0000</node_id>
          <term_definitions code="at0000">
            <items id="text">Test Template</items>
            <items id="description">A test template</items>
          </term_definitions>
        </definition>
      </template>
    `;

    // Convert the OPT to Web Template
    const webTemplate = await convertOPTtoWebTemplate(sampleOPT);

    // Verify the conversion
    expect(webTemplate).toBeDefined();
    expect(webTemplate.templateId).toBe('test_template');
    expect(webTemplate.semVer).toBe('1.0.0');
    expect(webTemplate.defaultLanguage).toBe('en');
    expect(webTemplate.tree).toBeDefined();
    expect(webTemplate.tree.name).toBe('Test Template');
    expect(webTemplate.tree.rmType).toBe('COMPOSITION');
  });

  test('should handle attributes and child nodes', async () => {
    // More complex OPT with attributes and children
    const complexOPT = `
      <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <template xmlns="http://schemas.openehr.org/v1">
        <language>
          <terminology_id>
            <value>ISO_639-1</value>
          </terminology_id>
          <code_string>en</code_string>
        </language>
        <description>
          <lifecycle_state>unmanaged</lifecycle_state>
          <other_details id="sem_ver">1.0.0</other_details>
        </description>
        <template_id>
          <value>complex_template</value>
        </template_id>
        <concept>Complex Template</concept>
        <definition>
          <rm_type_name>COMPOSITION</rm_type_name>
          <node_id>at0000</node_id>
          <attributes xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="C_MULTIPLE_ATTRIBUTE">
            <rm_attribute_name>content</rm_attribute_name>
            <children xsi:type="C_ARCHETYPE_ROOT">
              <rm_type_name>SECTION</rm_type_name>
              <node_id>at0001</node_id>
              <occurrences>
                <lower>0</lower>
                <upper>1</upper>
              </occurrences>
            </children>
          </attributes>
          <term_definitions code="at0000">
            <items id="text">Complex Template</items>
            <items id="description">A complex test template</items>
          </term_definitions>
          <term_definitions code="at0001">
            <items id="text">Test Section</items>
            <items id="description">A test section</items>
          </term_definitions>
        </definition>
      </template>
    `;

    // Convert the OPT to Web Template
    const webTemplate = await convertOPTtoWebTemplate(complexOPT);

    // Verify the conversion
    expect(webTemplate).toBeDefined();
    expect(webTemplate.templateId).toBe('complex_template');
    expect(webTemplate.tree.children).toBeDefined();
    expect(webTemplate.tree.children.length).toBeGreaterThan(0);
    
    // Check child node
    const childNode = webTemplate.tree.children[0];
    expect(childNode).toBeDefined();
    expect(childNode.rmType).toBe('SECTION');
    expect(childNode.nodeId).toBe('at0001');
    expect(childNode.min).toBe(0);
    expect(childNode.max).toBe(1);
  });
});