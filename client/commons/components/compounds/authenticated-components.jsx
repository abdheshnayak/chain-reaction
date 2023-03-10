import { useRouter } from 'next/router';
import NonSSRWrapper from '@commons/helpers/no-ssr';
import { createContext, useState } from 'react';
// @ts-ignore
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export const userContext = createContext(null);

const AC = ({ children = null }) => {
  const auth = getAuth();
  const [user, setUser] = useState(null);
  const [userSynced, setUserSynced] = useState(false);
  const router = useRouter();
  onAuthStateChanged(auth, (u) => {
    if (u) {
      console.log('got user', u);
      setUser(u);
    } else {
      console.log('no user');
      router.replace('/auth/login');
    }
    setUserSynced(true);
  });
  return (
    <userContext.Provider value={{ user }}>
      {user && children}
      {!user && !userSynced && <div>Authenticating...</div>}
      {!user && userSynced && <div>Unauthorized</div>}
    </userContext.Provider>
  );
};
const AuthComponents = ({ children = null }) => {
  return (
    <NonSSRWrapper>
      <AC>{children}</AC>
    </NonSSRWrapper>
  );
};

export default AuthComponents;
