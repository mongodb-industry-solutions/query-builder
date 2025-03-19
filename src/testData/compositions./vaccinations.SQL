WHERE 
    (c/content[openEHR-EHR-SECTION.immunisation_list.v0]/items[openEHR-EHR-ACTION.medication.v1]/time >= '2020-02-15' 
AND c/content[openEHR-EHR-SECTION.immunisation_list.v0]/items[openEHR-EHR-ACTION.medication.v1]/time <= '2022-02-15' 
AND c/context/other_context[at0004]/items[openEHR-EHR-CLUSTER.admin_salut.v0]/items[at0007]/items[at0014]/value/defining_code/code_string = 'E08553936' 
AND c/content[openEHR-EHR-SECTION.immunisation_list.v0]/items[openEHR-EHR-ACTION.medication.v1]/other_participations/performer/identifiers/id = '47958034K') 
LIMIT 1
    
{
  "_id": "00c33737-7a1f-4d7f-b247-5e15dad946ee::ehrbase.ehrbase.org::1",
  "version": "1",
  "ehr_id": "029c57f-fcf8-4c66-aae9-b4d7bb5c1cc",
  "folder_id": "<if needed>",
  "archetypeNodeId": "openEHR-EHR-COMPOSITION.vaccination_list.v0",
  "templateId": "HC3 Immunization List v0.5",

  // Flatten feeder_audit info (optional or partial):
  "feederAudit": [
    { "id": "114009866392165...", "type": "cpc" },
    { "id": "263864399", "type": "cpi" },
    ...
  ],

  // Flatten context:
  "context": {
    "startTime": "2023-12-22T06:11:25.136Z",
    "settingCode": "238",
    "settingValue": "other care",
    "otherContextItems": [
      {
        "archetypeNodeId": "openEHR-EHR-CLUSTER.xds_metadata.v0",
        "items": [
          { "archetypeNodeId": "at0003", "code_string": "VAC" },
          { "archetypeNodeId": "at0004", "code_string": "N" }
        ]
      },
      {
        "archetypeNodeId": "openEHR-EHR-CLUSTER.admin_salut.v0",
        "items": [
          { "archetypeNodeId": "at0001", "date": "2016-07-04T06:02:19.000Z" },
          // ... other items ...
          { 





06eb15e4-40ec-4fc2-92a7-5978e4bfdb94::ehrbase.ehrbase.org::1


{
  "_id": {
    "$oid": "6762a570f384ceb8faaf8cbc"
  },
  "ehrid": "4e1001c-6c68-4118-8407-46fc51f30fe",
  "CanonicalJSON": {
    "_type": "COMPOSITION",
    "name": {
      "_type": "DV_TEXT",
      "value": "HC3 Immunization List"
    },
    "archetype_details": {
      "archetype_id": {
        "value": "openEHR-EHR-COMPOSITION.vaccination_list.v0"
      },
      "template_id": {
        "value": "HC3 Immunization List v0.5"
      },
      "rm_version": "1.0.4"
    },
    "feeder_audit": {
      "_type": "FEEDER_AUDIT",
      "originating_system_item_ids": [
        {
          "_type": "DV_IDENTIFIER",
          "id": "56860843166447885884964984954778812416",
          "type": "cpc"
        },
        {
          "_type": "DV_IDENTIFIER",
          "id": "379807260",
          "type": "cpi"
        },
        {
          "_type": "DV_IDENTIFIER",
          "id": "232917761",
          "type": "center_origin"
        }
      ],
      "feeder_system_item_ids": [
        {
          "_type": "DV_IDENTIFIER",
          "id": "56860843166447885884964984954778812416",
          "type": "cpc"
        }
      ],
      "originating_system_audit": {
        "_type": "FEEDER_AUDIT_DETAILS",
        "system_id": "salutms.cat"
      }
    },
    "language": {
      "_type": "CODE_PHRASE",
      "terminology_id": {
        "_type": "TERMINOLOGY_ID",
        "value": "ISO_639-1"
      },
      "code_string": "en"
    },
    "territory": {
      "_type": "CODE_PHRASE",
      "terminology_id": {
        "_type": "TERMINOLOGY_ID",
        "value": "ISO_3166-1"
      },
      "code_string": "ES"
    },
    "category": {
      "_type": "DV_CODED_TEXT",
      "value": "event",
      "defining_code": {
        "_type": "CODE_PHRASE",
        "terminology_id": {
          "_type": "TERMINOLOGY_ID",
          "value": "openehr"
        },
        "code_string": "433"
      }
    },
    "composer": {
      "_type": "PARTY_IDENTIFIED",
      "identifiers": [
        {
          "_type": "DV_IDENTIFIER",
          "id": "HC3"
        }
      ]
    },
    "context": {
      "_type": "EVENT_CONTEXT",
      "start_time": {
        "_type": "DV_DATE_TIME",
        "value": {
          "$date": "2023-12-18T17:46:53.855Z"
        }
      },
      "setting": {
        "_type": "DV_CODED_TEXT",
        "value": "other care",
        "defining_code": {
          "_type": "CODE_PHRASE",
          "terminology_id": {
            "_type": "TERMINOLOGY_ID",
            "value": "openehr"
          },
          "code_string": "238"
        }
      },
      "other_context": {
        "_type": "ITEM_TREE",
        "name": {
          "_type": "DV_TEXT",
          "value": "Tree"
        },
        "items": [
          {
            "_type": "CLUSTER",
            "name": {
              "_type": "DV_TEXT",
              "value": "XDS Metadata"
            },
            "archetype_details": {
              "archetype_id": {
                "value": "openEHR-EHR-CLUSTER.xds_metadata.v0"
              },
              "template_id": {
                "value": "HC3 Immunization List v0.5"
              },
              "rm_version": "1.0.4"
            },
            "items": [
              {
                "_type": "ELEMENT",
                "name": {
                  "_type": "DV_TEXT",
                  "value": "Document type"
                },
                "value": {
                  "_type": "DV_CODED_TEXT",
                  "value": "-",
                  "defining_code": {
                    "_type": "CODE_PHRASE",
                    "terminology_id": {
                      "_type": "TERMINOLOGY_ID",
                      "value": "2.16.840.1.113883.6.1"
                    },
                    "code_string": "VAC"
                  }
                },
                "archetype_node_id": "at0003"
              },
              {
                "_type": "ELEMENT",
                "name": {
                  "_type": "DV_TEXT",
                  "value": "Confidentiality code"
                },
                "value": {
                  "_type": "DV_CODED_TEXT",
                  "value": "-",
                  "defining_code": {
                    "_type": "CODE_PHRASE",
                    "terminology_id": {
                      "_type": "TERMINOLOGY_ID",
                      "value": "2.16.840.1.113883.5.25"
                    },
                    "code_string": "N"
                  }
                },
                "archetype_node_id": "at0004"
              }
            ],
            "archetype_node_id": "openEHR-EHR-CLUSTER.xds_metadata.v0"
          },
          {
            "_type": "CLUSTER",
            "name": {
              "_type": "DV_TEXT",
              "value": "Admin Salut"
            },
            "archetype_details": {
              "archetype_id": {
                "value": "openEHR-EHR-CLUSTER.admin_salut.v0"
              },
              "template_id": {
                "value": "HC3 Immunization List v0.5"
              },
              "rm_version": "1.0.4"
            },
            "items": [
              {
                "_type": "ELEMENT",
                "name": {
                  "_type": "DV_TEXT",
                  "value": "Document authorisation date"
                },
                "value": {
                  "_type": "DV_DATE_TIME",
                  "value": {
                    "$date": "2017-06-11T08:40:04.000Z"
                  }
                },
                "archetype_node_id": "at0001"
              },
              {
                "_type": "ELEMENT",
                "name": {
                  "_type": "DV_TEXT",
                  "value": "Document creation date"
                },
                "value": {
                  "_type": "DV_DATE_TIME",
                  "value": {
                    "$date": "2017-06-11T08:40:04.000Z"
                  }
                },
                "archetype_node_id": "at0002"
              },
              {
                "_type": "ELEMENT",
                "name": {
                  "_type": "DV_TEXT",
                  "value": "Document publication date"
                },
                "value": {
                  "_type": "DV_DATE_TIME",
                  "value": {
                    "$date": "2017-06-11T08:45:08.000Z"
                  }
                },
                "archetype_node_id": "at0023"
              },
              {
                "_type": "CLUSTER",
                "name": {
                  "_type": "DV_TEXT",
                  "value": "Publishing institution"
                },
                "items": [
                  {
                    "_type": "ELEMENT",
                    "name": {
                      "_type": "DV_TEXT",
                      "value": "Publishing centre"
                    },
                    "value": {
                      "_type": "DV_CODED_TEXT",
                      "value": "-",
                      "defining_code": {
                        "_type": "CODE_PHRASE",
                        "terminology_id": {
                          "_type": "TERMINOLOGY_ID",
                          "value": "2.16.840.1.113883.2.19.10.1"
                        },
                        "code_string": "E08003820"
                      }
                    },
                    "archetype_node_id": "at0014"
                  },
                  {
                    "_type": "ELEMENT",
                    "name": {
                      "_type": "DV_TEXT",
                      "value": "Publishing UP"
                    },
                    "value": {
                      "_type": "DV_CODED_TEXT",
                      "value": "-",
                      "defining_code": {
                        "_type": "CODE_PHRASE",
                        "terminology_id": {
                          "_type": "TERMINOLOGY_ID",
                          "value": "-"
                        },
                        "code_string": "00168"
                      }
                    },
                    "archetype_node_id": "at0016"
                  }
                ],
                "archetype_node_id": "at0007"
              },
              {
                "_type": "CLUSTER",
                "name": {
                  "_type": "DV_TEXT",
                  "value": "Custodial institution"
                },
                "items": [
                  {
                    "_type": "ELEMENT",
                    "name": {
                      "_type": "DV_TEXT",
                      "value": "Custodial centre"
                    },
                    "value": {
                      "_type": "DV_CODED_TEXT",
                      "value": "-",
                      "defining_code": {
                        "_type": "CODE_PHRASE",
                        "terminology_id": {
                          "_type": "TERMINOLOGY_ID",
                          "value": "2.16.840.1.113883.4.292.10.4"
                        },
                        "code_string": "E08003820"
                      }
                    },
                    "archetype_node_id": "at0017"
                  }
                ],
                "archetype_node_id": "at0010"
              }
            ],
            "archetype_node_id": "openEHR-EHR-CLUSTER.admin_salut.v0"
          }
        ],
        "archetype_node_id": "at0004"
      }
    },
    "content": [
      {
        "_type": "SECTION",
        "name": {
          "_type": "DV_TEXT",
          "value": "Immunization list"
        },
        "archetype_details": {
          "archetype_id": {
            "value": "openEHR-EHR-SECTION.immunisation_list.v0"
          },
          "template_id": {
            "value": "HC3 Immunization List v0.5"
          },
          "rm_version": "1.0.4"
        },
        "items": [
          {
            "_type": "ACTION",
            "name": {
              "_type": "DV_TEXT",
              "value": "Immunization management"
            },
            "archetype_details": {
              "archetype_id": {
                "value": "openEHR-EHR-ACTION.medication.v1"
              },
              "template_id": {
                "value": "HC3 Immunization List v0.5"
              },
              "rm_version": "1.0.4"
            },
            "language": {
              "_type": "CODE_PHRASE",
              "terminology_id": {
                "_type": "TERMINOLOGY_ID",
                "value": "ISO_639-1"
              },
              "code_string": "en"
            },
            "encoding": {
              "_type": "CODE_PHRASE",
              "terminology_id": {
                "_type": "TERMINOLOGY_ID",
                "value": "IANA_character-sets"
              },
              "code_string": "UTF-8"
            },
            "subject": {
              "_type": "PARTY_SELF"
            },
            "provider": {
              "_type": "PARTY_IDENTIFIED",
              "identifiers": [
                {
                  "_type": "DV_IDENTIFIER",
                  "id": "A",
                  "type": "BCAE0AA4-92B6-11DC-AF5F-27E855D89593"
                }
              ]
            },
            "other_participations": [
              {
                "_type": "PARTICIPATION",
                "function": {
                  "_type": "DV_TEXT",
                  "value": "Performer"
                },
                "performer": {
                  "_type": "PARTY_IDENTIFIED",
                  "name": "MARTA",
                  "identifiers": [
                    {
                      "_type": "DV_IDENTIFIER",
                      "id": "C..C",
                      "type": "1.3.6.1.4.1.5734.1.2"
                    },
                    {
                      "_type": "DV_IDENTIFIER",
                      "id": "Q..L",
                      "type": "1.3.6.1.4.1.5734.1.3"
                    },
                    {
                      "_type": "DV_IDENTIFIER",
                      "id": "30883247",
                      "type": "2.16.840.1.113883.4.292.10.2"
                    },
                    {
                      "_type": "DV_IDENTIFIER",
                      "id": "NU",
                      "type": "83D02C4E-92B6-11DC-9BB7-10E755D89593"
                    }
                  ]
                }
              }
            ],
            "time": {
              "_type": "DV_DATE_TIME",
              "value": {
                "$date": "1990-05-24T22:00:00.000Z"
              }
            },
            "description": {
              "_type": "ITEM_TREE",
              "name": {
                "_type": "DV_TEXT",
                "value": "Tree"
              },
              "items": [
                {
                  "_type": "ELEMENT",
                  "name": {
                    "_type": "DV_TEXT",
                    "value": "Immunization item"
                  },
                  "value": {
                    "_type": "DV_CODED_TEXT",
                    "value": "Tos ferina",
                    "defining_code": {
                      "_type": "CODE_PHRASE",
                      "terminology_id": {
                        "_type": "TERMINOLOGY_ID",
                        "value": "2.16.840.1.113883.6.96"
                      },
                      "code_string": "61602008"
                    }
                  },
                  "archetype_node_id": "at0020"
                },
                {
                  "_type": "CLUSTER",
                  "name": {
                    "_type": "DV_TEXT",
                    "value": "Immunization details"
                  },
                  "archetype_details": {
                    "archetype_id": {
                      "value": "openEHR-EHR-CLUSTER.medication.v2"
                    },
                    "template_id": {
                      "value": "HC3 Immunization List v0.5"
                    },
                    "rm_version": "1.0.4"
                  },
                  "items": [
                    {
                      "_type": "CLUSTER",
                      "name": {
                        "_type": "DV_TEXT",
                        "value": "Constituent details"
                      },
                      "archetype_details": {
                        "archetype_id": {
                          "value": "openEHR-EHR-CLUSTER.medication.v2"
                        },
                        "template_id": {
                          "value": "HC3 Immunization List v0.5"
                        },
                        "rm_version": "1.0.4"
                      },
                      "items": [
                        {
                          "_type": "ELEMENT",
                          "name": {
                            "_type": "DV_TEXT",
                            "value": "Name"
                          },
                          "value": {
                            "_type": "DV_CODED_TEXT",
                            "value": "Tos ferina",
                            "defining_code": {
                              "_type": "CODE_PHRASE",
                              "terminology_id": {
                                "_type": "TERMINOLOGY_ID",
                                "value": "2.16.840.1.113883.6.96"
                              },
                              "code_string": "61602008"
                            }
                          },
                          "archetype_node_id": "at0132"
                        }
                      ],
                      "archetype_node_id": "openEHR-EHR-CLUSTER.medication.v2"
                    }
                  ],
                  "archetype_node_id": "openEHR-EHR-CLUSTER.medication.v2"
                }
              ],
              "archetype_node_id": "at0017"
            },
            "ism_transition": {
              "_type": "ISM_TRANSITION",
              "current_state": {
                "_type": "DV_CODED_TEXT",
                "value": "active",
                "defining_code": {
                  "_type": "CODE_PHRASE",
                  "terminology_id": {
                    "_type": "TERMINOLOGY_ID",
                    "value": "openehr"
                  },
                  "code_string": "245"
                }
              }
            },
            "archetype_node_id": "openEHR-EHR-ACTION.medication.v1"
          }
        ],
        "archetype_node_id": "openEHR-EHR-SECTION.immunisation_list.v0"
      }
    ],
    "archetype_node_id": "openEHR-EHR-COMPOSITION.vaccination_list.v0",
    "uid": {
      "_type": "OBJECT_VERSION_ID",
      "value": "06eb15e4-40ec-4fc2-92a7-5978e4bfdb94::ehrbase.ehrbase.org::1"
    }
  }
}

AND c/context/other_context[at0004]/items[openEHR-EHR-CLUSTER.admin_salut.v0]/items[at0007]/items[at0014]/value/defining_code/code_string = 'E08553936' 
AND c/content[openEHR-EHR-SECTION.immunisation_list.v0]/items[openEHR-EHR-ACTION.medication.v1]/time <= '2022-02-15' 
AND c/content[openEHR-EHR-SECTION.immunisation_list.v0]/items[openEHR-EHR-ACTION.medication.v1]/other_participations/performer/identifiers/id = '47958034K') 



{
  "_id": "06eb15e4-40ec-4fc2-92a7-5978e4bfdb94::ehrbase.ehrbase.org",
  "version": 1,
  "ehrid": "4e1001c-6c68-4118-8407-46fc51f30fe",
  "archetype_id": "openEHR-EHR-COMPOSITION.vaccination_list.v0"
  "CanonicalJSON": {
    "context": {
      "other_context": {
        "items": [
          {
            "items": [
              {
                "items": [
                  {
                    "value": {
                      "defining_code": {
                        "code_string": "E08003820"
                      }
                    },
                    "archetype_node_id": "at0014"
                  }
                ],
                "archetype_node_id": "at0007"
              }
            ],
            "archetype_node_id": "openEHR-EHR-CLUSTER.admin_salut.v0"
          }
        ],
        "archetype_node_id": "at0004"
      }
    },
    "content": [
      {
        "_type": "SECTION",
        "name": {
          "_type": "DV_TEXT",
          "value": "Immunization list"
        },
        "archetype_details": {
          "archetype_id": {
            "value": "openEHR-EHR-SECTION.immunisation_list.v0"
          },
          "template_id": {
            "value": "HC3 Immunization List v0.5"
          },
          "rm_version": "1.0.4"
        },
        "items": [
          {
            "_type": "ACTION",
            "name": {
              "_type": "DV_TEXT",
              "value": "Immunization management"
            },
            "archetype_details": {
              "archetype_id": {
                "value": "openEHR-EHR-ACTION.medication.v1"
              },
              "template_id": {
                "value": "HC3 Immunization List v0.5"
              },
              "rm_version": "1.0.4"
            },
            "language": {
              "_type": "CODE_PHRASE",
              "terminology_id": {
                "_type": "TERMINOLOGY_ID",
                "value": "ISO_639-1"
              },
              "code_string": "en"
            },
            "encoding": {
              "_type": "CODE_PHRASE",
              "terminology_id": {
                "_type": "TERMINOLOGY_ID",
                "value": "IANA_character-sets"
              },
              "code_string": "UTF-8"
            },
            "subject": {
              "_type": "PARTY_SELF"
            },
            "provider": {
              "_type": "PARTY_IDENTIFIED",
              "identifiers": [
                {
                  "_type": "DV_IDENTIFIER",
                  "id": "A",
                  "type": "BCAE0AA4-92B6-11DC-AF5F-27E855D89593"
                }
              ]
            },
            "other_participations": [
              {
                "_type": "PARTICIPATION",
                "function": {
                  "_type": "DV_TEXT",
                  "value": "Performer"
                },
                "performer": {
                  "_type": "PARTY_IDENTIFIED",
                  "name": "MARTA",
                  "identifiers": [
                    {
                      "_type": "DV_IDENTIFIER",
                      "id": "C..C",
                      "type": "1.3.6.1.4.1.5734.1.2"
                    },
                    {
                      "_type": "DV_IDENTIFIER",
                      "id": "Q..L",
                      "type": "1.3.6.1.4.1.5734.1.3"
                    },
                    {
                      "_type": "DV_IDENTIFIER",
                      "id": "30883247",
                      "type": "2.16.840.1.113883.4.292.10.2"
                    },
                    {
                      "_type": "DV_IDENTIFIER",
                      "id": "NU",
                      "type": "83D02C4E-92B6-11DC-9BB7-10E755D89593"
                    }
                  ]
                }
              }
            ],
            "time": {
              "_type": "DV_DATE_TIME",
              "value": {
                "$date": "1990-05-24T22:00:00.000Z"
              }
            },
            "description": {
              "_type": "ITEM_TREE",
              "name": {
                "_type": "DV_TEXT",
                "value": "Tree"
              },
              "items": [
                {
                  "_type": "ELEMENT",
                  "name": {
                    "_type": "DV_TEXT",
                    "value": "Immunization item"
                  },
                  "value": {
                    "_type": "DV_CODED_TEXT",
                    "value": "Tos ferina",
                    "defining_code": {
                      "_type": "CODE_PHRASE",
                      "terminology_id": {
                        "_type": "TERMINOLOGY_ID",
                        "value": "2.16.840.1.113883.6.96"
                      },
                      "code_string": "61602008"
                    }
                  },
                  "archetype_node_id": "at0020"
                },
                {
                  "_type": "CLUSTER",
                  "name": {
                    "_type": "DV_TEXT",
                    "value": "Immunization details"
                  },
                  "archetype_details": {
                    "archetype_id": {
                      "value": "openEHR-EHR-CLUSTER.medication.v2"
                    },
                    "template_id": {
                      "value": "HC3 Immunization List v0.5"
                    },
                    "rm_version": "1.0.4"
                  },
                  "items": [
                    {
                      "_type": "CLUSTER",
                      "name": {
                        "_type": "DV_TEXT",
                        "value": "Constituent details"
                      },
                      "archetype_details": {
                        "archetype_id": {
                          "value": "openEHR-EHR-CLUSTER.medication.v2"
                        },
                        "template_id": {
                          "value": "HC3 Immunization List v0.5"
                        },
                        "rm_version": "1.0.4"
                      },
                      "items": [
                        {
                          "_type": "ELEMENT",
                          "name": {
                            "_type": "DV_TEXT",
                            "value": "Name"
                          },
                          "value": {
                            "_type": "DV_CODED_TEXT",
                            "value": "Tos ferina",
                            "defining_code": {
                              "_type": "CODE_PHRASE",
                              "terminology_id": {
                                "_type": "TERMINOLOGY_ID",
                                "value": "2.16.840.1.113883.6.96"
                              },
                              "code_string": "61602008"
                            }
                          },
                          "archetype_node_id": "at0132"
                        }
                      ],
                      "archetype_node_id": "openEHR-EHR-CLUSTER.medication.v2"
                    }
                  ],
                  "archetype_node_id": "openEHR-EHR-CLUSTER.medication.v2"
                }
              ],
              "archetype_node_id": "at0017"
            },
            "ism_transition": {
              "_type": "ISM_TRANSITION",
              "current_state": {
                "_type": "DV_CODED_TEXT",
                "value": "active",
                "defining_code": {
                  "_type": "CODE_PHRASE",
                  "terminology_id": {
                    "_type": "TERMINOLOGY_ID",
                    "value": "openehr"
                  },
                  "code_string": "245"
                }
              }
            },
            "archetype_node_id": "openEHR-EHR-ACTION.medication.v1"
          }
        ],
        "archetype_node_id": "openEHR-EHR-SECTION.immunisation_list.v0"
      }
    ],
    "archetype_node_id": "openEHR-EHR-COMPOSITION.vaccination_list.v0",
    "uid": {
      "_type": "OBJECT_VERSION_ID",
      "value": "06eb15e4-40ec-4fc2-92a7-5978e4bfdb94::ehrbase.ehrbase.org::1"
    }
  }
}