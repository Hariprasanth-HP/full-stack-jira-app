import { BrowserRouter, Routes, Route } from "react-router-dom";
import Feature from "./components/Feature";
import Dashboard from "./pages/Dashboard";
import styled from "styled-components";
import { Button } from "@chakra-ui/react";

const Header = styled.header`
  grid-area: header;
  background: #0052cc;
  color: white;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Sidebar = styled.aside`
  grid-area: sidebar;
  background: #f4f5f7;
  padding: 1rem;
  border-right: 1px solid #ddd;

  @media (max-width: 768px) {
    display: none;
  }
`;

const DashboardContainer = styled.div`
  display: grid;
  width: 100vw;
  grid-template-areas:
    "header header"
    "sidebar content";
  grid-template-columns: 250px 1fr;
  grid-template-rows: 60px 1fr;
  height: 100vh;

  @media (max-width: 768px) {
    grid-template-areas:
      "header"
      "content";
    grid-template-columns: 1fr;
  }
`;

function App() {
  return (
    <DashboardContainer>
      <Header>
        <h1>Jira Clone</h1>

        {/* <Button colorScheme="blue" onClick={() => handleOpen("feature")}>
              + New Feature
            </Button> */}
      </Header>
      <Sidebar>
        <nav>
          <ul>
            <li>Boards</li>
            <li>Projects</li>
            <li>Issues</li>
          </ul>
        </nav>
      </Sidebar>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/features/:id" element={<Feature />} />
        </Routes>
      </BrowserRouter>
    </DashboardContainer>
  );
}
export default App;
