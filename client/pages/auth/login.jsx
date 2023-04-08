import { useEffect, useMemo, useState } from 'react';
import {
  // @ts-ignore
  getAuth,
  // @ts-ignore
  signOut,
  // @ts-ignore
  onAuthStateChanged,
  // @ts-ignore
  setPersistence,
  // @ts-ignore
  browserLocalPersistence,
  // @ts-ignore
  signInWithPopup,
  // @ts-ignore
  GoogleAuthProvider,
  // @ts-ignore
  signInAnonymously,
} from 'firebase/auth';
import BounceIt from '@commons/components/atom/bounce-it';
import { toast } from 'react-toastify';
import UserDp from '@commons/components/atom/user-dp';
import { useRouter } from 'next/router';

export const Button = ({ ...etc }) => {
  return (
    <BounceIt className="flex justify-center">
      <button
        {...etc}
        className="border px-3 py-1 rounded-md hover:bg-gray-500"
      />
    </BounceIt>
  );
};

export default function Home() {
  const auth = getAuth();
  const [user, setUser] = useState(null);
  const [userSynced, setUserSynced] = useState(false);
  useMemo(() => {
    onAuthStateChanged(auth, (u) => {
      if (u) {
        // console.log('got user');
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

  const router = useRouter();
  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user]);

  return (
    <div className="p-6">
      <div className="flex flex-col border  rounded-md p-6">
        {user && (
          <div className="flex justify-between items-center">
            <UserDp user={user} />

            <div>
              <Button onClick={signOutUser}>Sign Out</Button>
            </div>
          </div>
        )}

        {!user && !userSynced && <div>Authenticating...</div>}

        {!user && userSynced && (
          <>
            <LoginWithGoogle />
            <div className="justify-center flex flex-col  items-center gap-6 py-2">
              <span>or</span>

              <LoginAsGuest />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const LoginAsGuest = () => {
  const auth = getAuth();
  const login = async () => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInAnonymously(auth);
    } catch (err) {
      toast.error(err.message);
      console.log(err.code, err.message);
    }
  };

  return (
    <div>
      <Button onClick={login}>Login As Guest</Button>
    </div>
  );
};
const LoginWithGoogle = () => {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  const login = async () => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithPopup(auth, provider);
    } catch (err) {
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
