import React from "react";

const TitleContext = React.createContext({ title: null, setTitle: () => {} });

export default TitleContext;

export function withSetTitle(Wrapped) {
  function WithSetTitle(props) {
    return (
      <TitleContext.Consumer>
        {({ setTitle }) => <Wrapped setTitle={setTitle} {...props} />}
      </TitleContext.Consumer>
    );
  }
  WithSetTitle.displayName = `WithSetTitle(${Wrapped.displayName ||
    Wrapped.name ||
    "Component"})`;
  return WithSetTitle;
}
