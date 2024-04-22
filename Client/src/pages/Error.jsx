// import Jumbotron from "../components/Jumbotron";
// import Jumbotron from "../components/Jumbotron";
import { useRouteError } from 'react-router-dom'

const NoMatch = () => {
  const error = useRouteError();
  console.error(error)
  return (
    <div>
      {/* <Jumbotron> */}
        <h1>404 Page Not Found</h1>
        <h1>
          <span role="img" aria-label="Face With Rolling Eyes Emoji">
            🙄
          </span>
        </h1>
      {/* </Jumbotron> */}
    </div>
  );
};

export default NoMatch;
