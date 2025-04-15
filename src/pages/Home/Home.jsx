import ImgCarousel from "../../components/ImgCarousel/ImgCarousel";
import Graduacao from "../../components/Graduacao";
import About from "../../components/About";
const Home = () => {
  return (
    <div>
      <>
        <div>
          <About />
        </div>
        <div className="my-5">
          <ImgCarousel />
        </div>
        <div className="graduacao">
          <Graduacao></Graduacao>
        </div>
      </>
    </div>
  );
};

export default Home;
