import AuthComponents, {
  userContext,
} from '@commons/components/compounds/authenticated-components';
import { useContext, useEffect, useState } from 'react';
import Header1 from '@commons/components/atom/header1';
import { ContainerXl } from '@commons/components/atom/container';
import BounceIt from '@commons/components/atom/bounce-it';
import { useStarx } from '@commons/helpers/use-starx';
import md5 from '@commons/helpers/md5';
import { configs } from '@commons/config/config';

const PChild = () => {
  const { user } = useContext(userContext);
  const [members, setMembers] = useState({});
  const [messages, setMessage] = useState({});
  const onNewUser = (data) => {
    console.log('New user', data);
  };

  const onMembers = (data) => {
    setMembers(data?.members);
  };

  const join = (x) => {
    x.on('onMessage', (d) => {
      if (d?.id) {
        setMessage((s) => ({ ...s, [d.id]: d.content }));
      }
    });
  };

  const starx = useStarx({
    host: configs.host,
    port: configs.port,
    path: configs.path,
    onInit: (x) => {
      console.log('initialized');
      x.on('onNewUser', onNewUser);
      x.on('onMembers', onMembers);
      x.request('room.join', { email: user.email }, (_) => {
        join(x);
      });
    },
  });

  const [content, setContent] = useState('');

  const sendMessage = () => {
    if (starx) {
      try {
        starx.notify('room.message', {
          content,
          email: user.email,
        });
      } catch (err) {
        console.log(err);
      }
    }
  };

  useEffect(() => {
    sendMessage();
  }, [content]);

  return (
    <div className="flex flex-col gap-6">
      <Header1 user={user} />
      <ContainerXl>
        <div className="flex flex-col gap-6">
          <div className="flex gap-6">
            <form className="flex-1">
              <textarea
                className="bg-transparent border border-gray-500 rounded-md max-w-screen-sm min-h-[10rem] w-full"
                onChange={(e) => setContent(e.target.value)}
              />
              <button type="submit">submit</button>
            </form>
            <div className="flex gap-2 justify-end flex-wrap flex-1">
              {Object.keys(members).map((i) => {
                return (
                  <BounceIt title={members[i]} key={i}>
                    <img
                      src={`https://www.gravatar.com/avatar/${md5(members[i])}`}
                      alt="profile"
                      className="w-6 rounded-full"
                    />
                  </BounceIt>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {Object.keys(members).map((i) => {
              return (
                <div key={i} className="flex flex-col gap-2 border p-3">
                  <span>{members[i]}</span>
                  <span>{messages[i]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </ContainerXl>
    </div>
  );
};

const Profile = () => {
  return (
    <AuthComponents>
      <PChild />
    </AuthComponents>
  );
};

export default Profile;
