import { useContext, useMemo } from 'react';
import { Block } from './block';
import { gameCTX } from './game-context';

export const BlockRow = ({ row, rowData }) => {
  const ctx = useContext(gameCTX);
  const { serial } = ctx;

  return useMemo(() => {
    return (
      <div className="flex">
        {rowData.map((i, index) => {
          const key = `${row}-${index}`;
          return (
            <Block
              key={key}
              {...{
                serial,
                row,
                col: index,
                block: i,
              }}
            />
          );
        })}
      </div>
    );
  }, [rowData, row]);
};
