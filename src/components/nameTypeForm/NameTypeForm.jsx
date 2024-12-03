"use client";

import { useState } from "react";
import styles from "./NameTypeForm.module.css";
import TextInput from "@leafygreen-ui/text-input";
import Button from "@leafygreen-ui/button";

const NameTypeForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (name, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      console.log("Form submitted:", formData);
      setIsLoading(false);
    }, 3000);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <TextInput
          label="Name"
          placeholder="John Doe"
          onChange={(event) => handleChange("name", event.target.value)}
          value={formData.name}
        />
      </div>
      <div className={styles.formGroup}>
        <TextInput
          label="Type"
          placeholder="Type here"
          onChange={(event) => handleChange("type", event.target.value)}
          value={formData.type}
        />
      </div>

      <Button
        variant="primary"
        size="large"
        isLoading={isLoading}
        loadingText="Submitting..."
        type="submit"
      >
        Submit
      </Button>
    </form>
  );
};

export default NameTypeForm;
