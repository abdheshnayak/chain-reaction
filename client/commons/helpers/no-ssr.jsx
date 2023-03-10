import dynamic from 'next/dynamic';
import React from 'react';

// eslint-disable-next-line react/destructuring-assignment
const NonSSRWrapper = (props) => <>{props.children}</>;
export default dynamic(() => Promise.resolve(NonSSRWrapper), {
  ssr: false,
});
