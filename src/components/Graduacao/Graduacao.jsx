import  graduacao  from "../../assets/graduacao/graduacao-768x480.png";

const Graduacao = () => {
  return (
    <div
      className="text-center"
      style={{ maxWidth: "90%", margin: "auto", padding: "20px" }}
    >
      <h1 className="">Graduação</h1>
      <img src={graduacao} alt="" />
    </div>
  );
};

export default Graduacao;
