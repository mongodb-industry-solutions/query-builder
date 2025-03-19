
### 1. Review status of vaccination query

### 2. Review new challenges

### 3. Review general approaches and limitations ($search & $match)

- 5 levels ---- > ¿Patient array?
- Dynamic mapping does not support mappings to token 
- Recreation of indexes in every update?
- Search lookups 
- Can't resolve variables inside search blocks

### 3. CONTAINS Block
Challenge: https://docs.ehrbase.org/docs/EHRbase/Explore/AQL/Contains

Current denormalization approach:
https://github.com/mongodb-industry-solutions/openehr-mongodb/tree/main/utils/CompositionsWithNodes

- Review / improve approach
- Create example queries on it

### 4. Predicates in paths may be identified with compound predicates:

Normally: archetype_node_id
However, to make them unique, sometimes we can find the name as part of it or the value.

https://specifications.openehr.org/releases/1.0.1/html/architecture/overview/Output/paths_and_locators.html

Examples: 

Medication List
├── items [at0001]
│   ├── medication_name [at0002]: Paracetamol
│   └── dosage [at0003]: 500 mg
├── items [at0001]
│   ├── medication_name [at0002]: Ibuprofen
│   └── dosage [at0003]: 400 mg

Patient Observations
├── Measurement Event [at0006] (Measurement taken on Jan 1)
│   ├── systolic [at0004] → 120
│   └── diastolic [at0005] → 80
├── Measurement Event [at0006] (Measurement taken on Jan 2)
│   ├── systolic [at0004] → 125
│   └── diastolic [at0005] → 82
└── Measurement Event [at0006] (Measurement taken on Jan 3)
    ├── systolic [at0004] → 118
    └── diastolic [at0005] → 75

In our examples: 
- Medication Allergies by EHR ID
  ev/data[at0001]/items[at0130, 'Status']/value/value AS DESC_ESTAT,


### 5. Cross composition queries

### 6. Define a clear guide book

- Improve query builder during these days to consolidate our findings here

### 7. Any other necessary challenges we can work with
- Review JSON-LD + ontotext as an appropiate approach for analytical queries


