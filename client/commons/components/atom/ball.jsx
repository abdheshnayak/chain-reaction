import classNames from 'classnames';
import { motion } from 'framer-motion';

function Ball({ color, id, balls }) {
  return (
    <motion.div
      layoutId={id}
      transition={{
        ease: 'linear',
        duration: 0.2,
      }}
      className={classNames('flex justify-center items-center relative', {
      })}
    >
      <motion.div
      // initial={{ rotate: 0, scale: count > 0 ? 1.5 : 1 }}
      // animate={{
      //   rotate: 360,
      // }}
      // transition={{
      //   repeat: Infinity,
      //   ease: 'linear',
      //   duration: 3,
      // }}
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          viewBox="97.772 175.261 508.566 508.567"
        >
          <defs>
            <radialGradient
              id={color}
              cx="380.85"
              cy="472.23"
              r="255.55"
              gradientTransform="matrix(3.7387 -.05548 .03559 2.3982 -1080.1 -787.56)"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor={color} />
              <stop offset="1" />
            </radialGradient>
            <filter
              id="d"
              width="1.72"
              height="1.72"
              x="-0.36"
              y="-0.36"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur stdDeviation="18" />
            </filter>
            <filter
              id="c"
              width="1.572"
              height="1.97"
              x="-0.286"
              y="-0.485"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur stdDeviation="11.56" />
            </filter>
            <filter
              id="b"
              width="1.431"
              height="1.19"
              x="-0.215"
              y="-0.095"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur stdDeviation="5.901" />
            </filter>
          </defs>
          <path
            fill={`url(#${color})`}
            fillRule="evenodd"
            d="M594.7 505.59a254.29 254.29 0 01-316.23 167.36 254.29 254.29 0 01-170.55-314.53A254.29 254.29 0 01420.7 184.7a254.29 254.29 0 01176.88 311.01"
          />
          <circle
            cx="238.57"
            cy="319.51"
            r="60"
            fill="#fff"
            fillRule="evenodd"
            filter="url(#d)"
          />
          <ellipse
            cx="188.5"
            cy="817.18"
            fill="#fff"
            fillRule="evenodd"
            filter="url(#c)"
            rx="51.429"
            ry="22.857"
            transform="rotate(-21.878 -227.27 4.71)"
          />
          <path
            fill="#fff"
            fillRule="evenodd"
            d="M519.14 585.44c16.114-30.327 83.165-106.68 52.86-160.95 14.622-6.185 42.304 36.252-23.86 143.6z"
            filter="url(#b)"
          />
          <animateTransform
            attributeType="xml"
            attributeName="transform"
            type="rotate"
            from="360 0 0"
            to="0 0 0"
            dur="1s"
            additive="sum"
            repeatCount="indefinite"
          />
        </motion.svg>
      </motion.div>
    </motion.div>
  );
}

export default Ball;
