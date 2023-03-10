import classNames from 'classnames';

const Container = ({ children, className = '', ...props }) => {
  return (
    <div
      className={classNames('max-w-[1024px] mx-auto w-full px-4', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const ContainerXl = ({ children, className = '', ...props }) => {
  return (
    <div className="flex w-full justify-center">
      <div
        className={classNames('max-w-screen-xl w-full mx-4', className)}
        {...props}
      >
        {children}
      </div>
    </div>
  );
};

export default Container;
