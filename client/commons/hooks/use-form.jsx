import logger from '@commons/helpers/logger';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

function useForm({ initialValues, validationSchema, onSubmit = (_) => { } }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const checkIsPresent = useCallback(
    async (path, value) => {
      if (!errors[path]) return;

      try {
        await validationSchema.validate(
          { ...values, [path]: value },
          { abortEarly: false }
        );
        setErrors((prev) => ({ ...prev, [path]: undefined }));
      } catch (err) {
        const res = err.inner.filter((item) => item.path === path);
        if (res.length === 0) {
          setErrors((prev) => ({ ...prev, [path]: undefined }));
        } else {
          setErrors((prev) => ({ ...prev, [path]: res[0].message }));
        }
      }
    },
    [validationSchema, errors, values]
  );

  useEffect(() => {
    if (Object.keys(errors).length === 0) {
      const cleared = {};
      Object.keys(initialValues || {}).forEach((key) => {
        cleared[key] = undefined;
      });
      setErrors(cleared);
    }
  }, [initialValues, errors]);

  const handleChange = (keyPath) => {
    const keyPaths = keyPath.split('.');

    if (keyPaths.length > 1) {
      return (e) => {
        const newValue = e.target.value;
        setValues((prev) => {
          const updated = { ...prev };
          let ref = updated;
          for (let i = 0; i < keyPaths.length - 1; i++) {
            ref[keyPaths[i]] = { ...ref[keyPaths[i]] };
            ref = ref[keyPaths[i]];
          }
          ref[keyPaths.at(-1)] = newValue;
          return updated;
        });
        checkIsPresent(keyPath, newValue);
      };
    }

    return (e) => {
      const newValue = e.target.value;
      setValues((prev) => ({
        ...prev,
        [keyPath]: newValue,
      }));
      checkIsPresent(keyPath, newValue);
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Array.isArray(values)) {
      setErrors({});
    }

    try {
      await validationSchema.validate(values, {
        abortEarly: false,
      });

      try {
        const response = await onSubmit(values);
        return response;
      } catch (err) {
        console.error(err);
        toast.error(err.message);
        return false;
      }
    } catch (err) {
      logger.error(err);
      const fieldErrors = {};
      err.inner.forEach((item) => {
        fieldErrors[item.path] = item.message;
      });
      setErrors(fieldErrors);
      return false;
    }
  };

  return [values, errors, handleChange, handleSubmit, setValues];
}

export default useForm;
