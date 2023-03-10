import BounceIt from '@commons/components/atom/bounce-it';
import { FiPower } from 'react-icons/fi';
// @ts-ignore
import { getAuth, signOut } from 'firebase/auth';
import { toast } from 'react-toastify';
import md5 from '@commons/helpers/md5';

const Header1 = ({ user }) => {
  const auth = getAuth();

  const signOutUser = async () => {
    console.log(auth.currentUser);
    try {
      await signOut(auth);
    } catch (err) {
      toast.error(err.message);
      console.log(err.code, err.message);
    }
  };
  return (
    <div className="shadow-md py-2 flex justify-center px-1">
      <div className="w-full max-w-screen-xl flex justify-between items-center gap-3 mx-4">
        <div className="flex items-center gap-3">
          <img
            src={`https://www.gravatar.com/avatar/${md5(user.email)}`}
            alt="profile"
            className="w-6 rounded-full border"
          />
          {user.displayName || user.email}
        </div>
        <div className="flex items-center gap-2 py-4">
          <BounceIt className="cursor-pointer flex items-center">
            <button onClick={signOutUser}>
              <FiPower />
            </button>
          </BounceIt>
        </div>
      </div>
    </div>
  );
};

export default Header1;
