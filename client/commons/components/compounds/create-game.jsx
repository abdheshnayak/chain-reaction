import { userContext } from '@commons/components/compounds/authenticated-components';
import { useContext } from 'react';
import useForm from '@commons/hooks/use-form';
import yup from '@commons/helpers/yup';
import classNames from 'classnames';
import { Button } from '@pages/auth/login';

const Input = ({ className = '', ...etc }) => {
  return (
    <input
      className={classNames(
        'bg-transparent border rounded-md px-4 py-1',
        className
      )}
      {...etc}
    />
  );
};

export const JoinAny = ({ starx }) => {
  const { user } = useContext(userContext);

  const join = () => {
    starx.request('room.joinany', {
      user: {
        email: user.email,
        name: user.displayName || 'Guest User',
        isAnonymous: user.isAnonymous,
        uid: user.uid,
      },
    });
  };

  return (
    <div className="flex gap-3 items-center">
      <Button onClick={join} className="px-2 py-1">
        Join Any
      </Button>
    </div>
  );
};

export const JoinGame = ({ starx }) => {
  const { user } = useContext(userContext);
  const [values, _, handleChange, handleSubmit] = useForm({
    initialValues: {
      gameId: '',
    },
    validationSchema: yup.object({
      gameId: yup.string().required(),
    }),
    onSubmit: (vals) => {
      starx.request('room.join', {
        user: {
          email: user.email,
          name: user.displayName || 'Guest User',
          isAnonymous: user.isAnonymous,
          uid: user.uid,
        },
        gameId: vals.gameId,
      });
    },
  });

  return (
    <form className="flex gap-3 items-center" onSubmit={handleSubmit}>
      <Input
        placeholder="gameId"
        value={values.gameId}
        onChange={handleChange('gameId')}
      />

      <Button className="px-2 py-1" type="submit">
        Join
      </Button>
    </form>
  );
};

export const CreateGame = ({ starx }) => {
  const { user } = useContext(userContext);

  const [values, errors, handleChange, handleSubmit] = useForm({
    initialValues: {
      players: 2,
      grid: {
        cols: 8,
        rows: 12,
      },
    },
    validationSchema: yup.object({}),
    onSubmit: (vals) => {
      starx.request('room.create', {
        user: {
          email: user.email,
          name: user.displayName || 'Guest User',
          isAnonymous: user.isAnonymous,
          uid: user.uid,
        },

        players: Number(vals.players),
        grid: vals.grid,
      });
    },
  });

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-center">
      <Input
        type="number"
        value={values.players}
        error={errors.players}
        onChange={handleChange('players')}
        placeholder="players count"
      />
      <Button type="submit">New Game</Button>
    </form>
  );
};
