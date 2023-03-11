import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import useForm from '@commons/hooks/use-form';
import yup from '@commons/helpers/yup';
import { toast } from 'react-toastify';
import { Button } from './login';

const Input = ({ ...etc }) => {
  return (
    <input {...etc} className="bg-transparent border rounded-md py-2 px-3" />
  );
};

const Login = () => {
  const auth = getAuth();
  const [values, errors, handleChange, handleSubmit] = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: yup.object({
      email: yup.string().trim().required().email(),
      password: yup.string().trim().required(),
    }),
    onSubmit: async (v) => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        await signInWithEmailAndPassword(auth, v.email, v.password);
      } catch (err) {
        toast.error(err.message);
        console.log(err.code, err.message);
      }
    },
  });
  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col p-6 gap-3">
        Login
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Email"
            value={values.email}
            type="email"
            onChange={handleChange('email')}
            name="email"
          />
          <Input
            placeholder="Password"
            type="password"
            value={values.password}
            onChange={handleChange('password')}
            name="password"
          />

          <Button type="submit">Sign In</Button>
        </div>
      </div>
    </form>
  );
};
const Register = () => {
  const auth = getAuth();
  const [values, errors, handleChange, handleSubmit] = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: yup.object({
      email: yup.string().trim().required().email(),
      password: yup.string().trim().required(),
    }),
    onSubmit: async (v) => {
      try {
        await createUserWithEmailAndPassword(auth, v.email, v.password);
      } catch (err) {
        console.log(err.code, err.message);
        toast.error(err.message);
      }
    },
  });
  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col p-6 gap-3">
        Register
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Email"
            value={values.email}
            type="email"
            onChange={handleChange('email')}
          />
          <Input
            placeholder="Password"
            type="password"
            value={values.password}
            onChange={handleChange('password')}
          />

          <Button type="submit">Register</Button>
        </div>
      </div>
    </form>
  );
};

export default Login;
