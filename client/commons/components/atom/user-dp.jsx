import md5 from '@commons/helpers/md5';
import classNames from 'classnames';

const UserDp = ({ user, noname = false }) => {
  const { isOnline } = user;
  return (
    <div
      className={classNames('flex justify-between items-center', {
        grayscale: !isOnline,
      })}
    >
      {!user.isAnonymous && (
        <div className="flex items-center gap-3">
          <img
            src={`https://www.gravatar.com/avatar/${user.email}`}
            alt="profile"
            className="w-6 rounded-full border"
          />
          {!noname && (user.displayName || user.email)}
        </div>
      )}

      {user.isAnonymous && (
        <div className="flex items-center gap-3">
          <img
            src={`https://www.gravatar.com/avatar/${md5(
              `${user.uid}@gmail.com`
            )}?d=wavatar`}
            alt="profile"
            className="w-6 rounded-full border"
          />
          {!noname && 'Guest User'}
        </div>
      )}
    </div>
  );
};

export default UserDp;
