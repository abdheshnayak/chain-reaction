import logger from '@commons/helpers/logger';
import { useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useImmer } from 'use-immer';

function useForm({ initialValues, validationSchema, onSubmit = (_) => {} }) {
  const [values, setValues] = useImmer(initialValues);
  const [errors, seterrors] = useImmer({});

  const checkIsPresent = useCallback(
    async (path, value) => {
      if (!errors[path]) return;

      try {
        await validationSchema.validate(
          { ...values, [path]: value },
          {
            abortEarly: false,
          }
        );
        seterrors({});
      } catch (err) {
        const res = err.inner.filter((item) => item.path === path);
        if (res.length === 0)
          seterrors((d) => {
            d[path] = undefined;
          });
        else {
          seterrors((d) => {
            d[path] = res[0].message;
          });
        }
      }
    },
    [validationSchema, errors, seterrors, values]
  );

  useEffect(() => {
    if (Object.keys(errors).length === 0)
      Object.keys(initialValues || {}).map((key) => {
        seterrors((d) => {
          d[key] = undefined;
        });
        return true;
      });
  }, [initialValues, seterrors, errors]);

  const handleChange = (keyPath) => {
    const keyPaths = keyPath.split('.');
    if (keyPaths.length > 1) {
      return (e) => {
        setValues((d) => {
          if (
            e.target.value !== false &&
            !e.target.value &&
            e.target.value !== ''
          ) {
            delete d[keyPaths[0]][keyPaths[1]]?.[keyPaths[2]]?.[keyPaths[3]]?.[
              keyPaths[4]
            ];
          }
          if (keyPaths.length === 2) {
            d[keyPaths[0]][keyPaths[1]] = e.target.value;
          } else if (keyPaths.length === 3) {
            d[keyPaths[0]][keyPaths[1]][keyPaths[2]] = e.target.value;
          } else if (keyPaths.length === 4) {
            d[keyPaths[0]][keyPaths[1]][keyPaths[2]][keyPaths[3]] =
              e.target.value;
          }
        });
        checkIsPresent(keyPath, e.target.value);
      };
    }
    return (e) => {
      setValues((d) => {
        if (
          e.target.value !== false &&
          e.target.value !== '' &&
          !e.target.value
        ) {
          delete d[keyPath];
        } else {
          d[keyPath] = e.target.value;
        }
      });
      checkIsPresent(keyPath, e.target.value);
    };
  };

  const handleSubmit = async (e) => {
    // e.stopPropagation();
    e.preventDefault();

    if (values instanceof Array) {
      seterrors({});
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
        // show server error
      }
    } catch (err) {
      // show field errors
      logger.error(err);
      err.inner.map((item) => {
        seterrors((d) => {
          d[item.path] = item.message;
        });
        return true;
      });
      return false;
    }
  };

  return [values, errors, handleChange, handleSubmit, setValues];
}

export default useForm;
