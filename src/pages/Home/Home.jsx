import Parceiros from "./Parceiros";
import Eventos from "./Eventos";
import About from "./About";

const Home = () => {
  return (
    <div>
      <>
        <div>
          <About />
        </div>
        <div className="my-5">
          <Parceiros />
        </div>
        <div className="graduacao">
          <Eventos></Eventos>
        </div>
      </>
    </div>
  );
};

export default Home;
