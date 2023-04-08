import { useContext, useEffect } from 'react';
import Ball from '../atom/ball';
import UserDp from '../atom/user-dp';
import { userContext } from './authenticated-components';
import { BlockRow } from './block-row';
import { ballColors, gameCTX } from './game-context';

export default function Game({ currentGame, starx }) {
  const { user: mainUser } = useContext(userContext);
  const { user, grid, data } = currentGame;
  const { serial, uid } = user;

  useEffect(() => {
    // console.log(currentGame);
  }, [currentGame]);

  const [gridCol, gridRow] = [grid?.cols, grid?.rows];

  return (
    <gameCTX.Provider
      value={{
        starx,
        gridCol,
        gridRow,
        data,
        serial,
      }}
    >
      <div className="flex flex-col gap-3 max-h-screen overflow-y-auto">
        <div className="flex flex-col">
          <div className="flex flex-col min-h-screen gap-6 p-4">
            <div className="flex justify-end gap-6">
              {mainUser.uid === uid && (
                <div className="w-6 h-6">
                  <Ball
                    {...{
                      count: 1,
                      color: ballColors[serial],
                      id: 'turn',
                      index: 0,
                    }}
                  />
                </div>
              )}
              <UserDp user={user} />
            </div>
            <div className="flex border p-2 rounded-md">
              {/*
                // {Array.from(Array(gridRow).keys()).map((i) => {
              */}
              <div className="flex flex-col">
                {data.map((i, index) => {
                  // @ts-ignore
                  const key = index;
                  return (
                    <BlockRow
                      key={key}
                      {...{
                        serial,
                        row: index,
                        rowData: i,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        {/* <code className="bg-gray-500"> */}
        {/*   <pre>{JSON.stringify(game, null, 2)}</pre> */}
        {/* </code> */}
      </div>
    </gameCTX.Provider>
  );
}
