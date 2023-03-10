import { useMemo, useState } from 'react';
// @ts-ignore
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
import BounceIt from '@commons/components/atom/bounce-it';
import { toast } from 'react-toastify';

const Button = ({ ...etc }) => {
  return (
    <BounceIt className="flex justify-center">
      <button
        {...etc}
        className="border px-3 py-1 rounded-md hover:bg-gray-500"
      />
    </BounceIt>
  );
};

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

export default function Home() {
  const auth = getAuth();
  const [user, setUser] = useState(null);
  const [userSynced, setUserSynced] = useState(false);
  useMemo(() => {
    onAuthStateChanged(auth, (u) => {
      if (u) {
        console.log('got user');
        setUser(u);
      } else {
        console.log('no user');
      }
      setUserSynced(true);
    });
  }, []);

  const signOutUser = async () => {
    console.log(auth.currentUser);
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      toast.error(err.message);
      console.log(err.code, err.message);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col border  rounded-md p-6">
        {user && (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="flex justify-center items-center">
                <img
                  src={`https://www.gravatar.com/avatar/${btoa(user.email)}`}
                  alt="profile"
                  className="w-8 rounded-full"
                />
              </div>
              <div>{user.email}</div>
            </div>
            <div>
              <Button onClick={signOutUser}>Sign Out</Button>
            </div>
          </div>
        )}

        {!user && !userSynced && <div>Authenticating...</div>}

        {!user && userSynced && (
          <>
            <Login />
            <hr />

            <LoginWithGoogle />
            <hr />
            <div className="justify-center flex py-2">
              <span>or</span>
            </div>
            <hr />
            <Register />
          </>
        )}
      </div>
    </div>
  );
}

const LoginWithGoogle = () => {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  const login = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      await setPersistence(auth, browserLocalPersistence);

      toast.error(err.message);
      console.log(err.code, err.message);
    }
  };

  return (
    <div>
      <Button onClick={login}>Login With google</Button>
    </div>
  );
};
