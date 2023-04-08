import AuthComponents, {
  userContext,
} from '@commons/components/compounds/authenticated-components';
import { useContext, useState } from 'react';
import Header1 from '@commons/components/atom/header1';
import { ContainerXl } from '@commons/components/atom/container';
import { configs } from '@commons/config/config';
import UserDp from '@commons/components/atom/user-dp';
import {
  CreateGame,
  JoinAny,
  JoinGame,
} from '@commons/components/compounds/create-game';
import { useStarx } from '@commons/helpers/use-starx';
import { toast } from 'react-toastify';
import Game from '@commons/components/compounds/game';
import { Button } from './auth/login';

const PChild = () => {
  const { user } = useContext(userContext);
  const [currentGame, setCurrentGame] = useState(null);

  const [gameComplete, setGameComplete] = useState(false);

  const [members, setMembers] = useState({});
  const onNewUser = (data) => {
    // console.log('New user', data);
  };

  const onWinner = (data) => {
    toast.success('win');
    setGameComplete(true);
  };

  const onGameId = (data) => {
    // console.log(data);
    setCurrentGame(data);
  };

  const onMembers = (data) => {
    // console.log(data);
    setMembers(data?.members);
  };

  const starx = useStarx({
    host: configs.host,
    port: configs.port,
    path: configs.path,
    onInit: (x) => {
      x.on('onNewUser', onNewUser);
      x.on('onMembers', onMembers);
      x.on('onGame', onGameId);
      x.on('onWinner', onWinner);
      x.on('onError', (data) => toast.error(data));

      x.request(
        'room.land',
        {
          user: {
            email: user.email,
            name: user.displayName || 'Guest User',
            isAnonymous: user.isAnonymous,
            uid: user.uid,
          },
        },
        (i) => {
          console.log(i, 'here');
          // join(x);

          // x.on('onGame', onGameId);
          // x.on('onNewUser', onNewUser);
          // x.on('onMembers', onMembers);
        }
      );
    },
  });

  const startGame = () => {
    if (starx) {
      try {
        starx.notify('room.start', {});
      } catch (err) {
        console.log(err);
      }
    }
  };

  const exit = () => {
    if (starx) {
      try {
        starx.request('room.exit', {});
        setCurrentGame(null);
      } catch (err) {
        console.log(err);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Header1 user={user} />
      <ContainerXl>
        {gameComplete && (
          <div>
            <Button onClick={exit}>Exit</Button>
          </div>
        )}
        <div>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between">
              {currentGame && <Button onClick={exit}>Exit</Button>}
              {currentGame && (
                <div className="flex items-center gap-3">
                  <div>
                    GameId:{' '}
                    {
                      // @ts-ignore
                      currentGame?.id
                    }
                  </div>
                  <div>
                    Players:{' '}
                    {
                      // @ts-ignore
                      currentGame?.players
                    }
                  </div>
                  <div>
                    Waiting for :{' '}
                    {currentGame?.players - Object.keys(members).length} Players
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                {Object.keys(members).map((key) => {
                  return <UserDp noname key={key} user={members[key]} />;
                })}
              </div>
            </div>
          </div>
        </div>

        {currentGame ? (
          <>
            {/* @ts-ignore */}
            {currentGame.started ? (
              <Game currentGame={currentGame} starx={starx} />
            ) : (
              currentGame?.players - Object.keys(members).length === 0 && (
                <Button onClick={startGame}>Start</Button>
              )
            )}
          </>
        ) : (
          <div className="flex justify-center py-24">
            <div className="flex flex-col gap-3">
              <JoinGame {...{ starx, onNewUser, onGameId, onMembers }} />
              <span>OR</span>
              <CreateGame {...{ starx, onNewUser, onGameId, onMembers }} />

              <span>OR</span>
              <JoinAny {...{ starx, onNewUser, onGameId, onMembers }} />
            </div>
          </div>
        )}
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
