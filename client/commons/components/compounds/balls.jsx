import classNames from 'classnames';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import Ball from '../atom/ball';

export const Balls = ({ balls, color  }) => {
  return useMemo(() => {
    return (
      <motion.div
        className={classNames(
          'relative w-6 h-6 aspect-square grid  justify-center grid-cols-2'
        )}
      >
        {balls.map((item, index) => {
          return (
            <Ball
              key={item.id}
              {...{
                color,
                id: item.id,
                index,
                count: balls.length,
              }}
            />
          );
        })}
      </motion.div>
    );
  }, [balls, color]);
};
