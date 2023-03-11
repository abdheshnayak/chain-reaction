const UserDp = ({ user }) => {
  if (!user.isAnonymous) {
    return (
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
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="flex justify-center items-center">
          <img
            src={`https://www.gravatar.com/avatar/${btoa(
              user.email
            )}?d=wavatar`}
            alt="profile"
            className="w-8 rounded-full"
          />
        </div>
        <div>Guest User</div>
      </div>
    </div>
  );
};

export default UserDp;
