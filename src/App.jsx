import { Container } from "react-bootstrap";
import { AppRoutes } from "./router/AppRoutes";
import MenuBar from "./components/MenuBar";
import TheFooter from "./components/TheFooter";
import MenuEvento from "./components/MenuEvento";
import WhatsAppButton from "./components/WhatsAppButton";
import "./App.css";

//Em baixo do TheFooter
//<WhatsAppButton />

function App() {
  return (
    <>
      <MenuBar />
      <main>
        <Container style={{ minHeight: "50vh" }} className="border shadow-lg p-4 bg-white my-5 d-flex flex-column justify-center">
          <AppRoutes />
        </Container>
        <MenuEvento />
      </main>
      <TheFooter />
    </>
  );
}

export default App;
