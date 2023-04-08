  import 'react-toastify/dist/ReactToastify.css';
// eslint-disable-next-line no-unused-vars
import { firebaseInit } from '@commons/libs/firebase';
import { ToastContainer } from 'react-toastify';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <div className="bg-[#111] min-h-screen text-white">
      <ToastContainer />
      {/* <StarX /> */}
      <Component {...pageProps} />
    </div>
  );
}

export default MyApp;
