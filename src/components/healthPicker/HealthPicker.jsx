"use client";

import { useState } from "react";
import styles from "./HealthPicker.module.css";
import { Combobox, ComboboxOption } from "@leafygreen-ui/combobox";

const HealthcarePicker = () => {
  const [selectedOption, setSelectedOption] = useState("");

  const handleOptionChange = (value) => {
    setSelectedOption(value);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Select Healthcare Standard</h2>
      <div className={styles.combobox}>
        <Combobox
          label="Choose a standard"
          description="Please pick one"
          placeholder="Select standard"
          onChange={handleOptionChange}
        >
          <ComboboxOption value="FHIR" />
          <ComboboxOption value="openEHR" />
          <ComboboxOption value="DICOM" />
        </Combobox>
      </div>
      <div className={styles.selection}>
        {selectedOption && <p>You have selected: {selectedOption}</p>}
      </div>
    </div>
  );
};

export default HealthcarePicker;
