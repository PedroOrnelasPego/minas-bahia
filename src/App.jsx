import { Container } from "react-bootstrap";
import { AppRoutes } from "./router/AppRoutes";
import MenuBar from "./components/MenuBar";
import TheFooter from "./components/TheFooter";
import MenuEvento from "./components/MenuEvento";
import WhatsAppButton from "./components/WhatsAppButton";
import "./App.css";

function App() {
  return (
    <>
      <MenuBar />
      <Container className="border shadow-lg p-4 bg-white my-5">
        <AppRoutes />
      </Container>
      <MenuEvento />
      <TheFooter />
      <WhatsAppButton />
    </>
  );
}

export default App;
