import React, { useState } from "react";
import styled from "styled-components";
import {
  Box,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  VStack,
  Text,
} from "@chakra-ui/react";
import IssueForm from "../components/IssueForm";
import axios from "axios";

const DashboardContainer = styled.div`
  display: grid;
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

const Content = styled.main`
  grid-area: content;
  padding: 2rem;
  background: #ffffff;
  overflow-y: auto;
`;

const Dashboard = () => {
  const [issues, setIssues] = useState<any[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [dirtyForm, setDirtyForm] = useState(undefined);

  // Called when a new issue is created
  const handleIssueCreated = async(issue: any) => {
    const formattedIssue = {
      ...issue,dueDate: new Date(issue.dueDate).toISOString(),
    }
    if (!dirtyForm) {
      const {data} = await axios({
        method: "POST",
        url: "/tasks/create",
        data: formattedIssue,
        headers: {
          "Content-Type": "application/json",
        },
      });
      setIssues(data);
    } else {
      // Editing existing issue
      setIssues((prev) =>
        prev.map((i) => (i?.id === dirtyForm?.id ? issue : i))
      );
    }
    onClose();
    setDirtyForm(undefined);
  };

  return (
    <DashboardContainer>
      <Header>
        <h1>Jira Clone</h1>
        <Button colorScheme="blue" onClick={onOpen}>
          + New Issue
        </Button>
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
      <Content>
        <h2>Tasks</h2>
        <VStack align="stretch" spacing={4} mb={8}>
          {issues.length === 0 && <Text color="gray.500">No issues yet.</Text>}
          {issues.map((issue, idx) => (
            <Box
              key={idx}
              p={4}
              borderWidth={1}
              borderRadius="md"
              bg="gray.50"
              onClick={() => {
                setDirtyForm(issue);
                onOpen();
              }}
            >
              <Text fontWeight="bold">{issue.summary}</Text>
              <Text fontSize="sm" color="gray.600">
                {issue.type} | {issue.priority}
              </Text>
              <Text mt={2}>{issue.description}</Text>
            </Box>
          ))}
        </VStack>
        {/* Modal for IssueForm */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Create New Issue</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <IssueForm
                existingFormData={dirtyForm}
                onIssueCreated={handleIssueCreated}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      </Content>
    </DashboardContainer>
  );
};

export default Dashboard;
