import { motion } from 'framer-motion';

const BounceIt = ({ children = null, ...etc }) => {
  return (
    <motion.div initial={{ y: 0 }} whileTap={{ y: 1 }} {...etc}>
      {children}
    </motion.div>
  );
};

export default BounceIt;
