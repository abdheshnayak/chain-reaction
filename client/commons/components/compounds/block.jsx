import classNames from 'classnames';
import { useContext, useMemo } from 'react';
import { Balls } from './balls';
import { ballColors, gameCTX } from './game-context';

export const Block = ({ block, row, col }) => {
  const ctx = useContext(gameCTX);

  const { serial, starx } = ctx;

  const onClick = () => {
    if (starx) {
      try {
        starx.request('room.click', {
          row,
          col,
        });
      } catch (err) {
        console.log(err);
      }
    }
  };

  const { user, balls } = block;

  return useMemo(() => {
    return (
      <div
        style={{ borderColor: ballColors[serial] }}
        className={classNames('border p-2 cursor-pointer', {})}
        onClick={onClick}
      >
        <Balls {...{ row, col, balls: balls || [], color: ballColors[user] }} />
      </div>
    );
  }, [block.user, block.balls, serial]);
};
