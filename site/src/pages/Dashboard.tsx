import React, { useEffect, useState } from "react";
import styled from "styled-components";
import {
  Box,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  VStack,
  Text,
  HStack,
  Badge,
} from "@chakra-ui/react";
import IssueForm from "../components/IssueForm";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Collapse, Button, AccordionItem, Accordion, AccordionButton, AccordionPanel, AccordionIcon } from "@chakra-ui/react";

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

const Content = styled.main`
  grid-area: content;
  padding: 2rem;
  background: #ffffff;
  overflow-y: auto;
`;
export type IFormType = "task" | "feature";
const Dashboard = () => {
  const [issues, setIssues] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [formType, setFormType] = useState<IFormType>("task");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [dirtyForm, setDirtyForm] = useState(undefined);
  const navigate = useNavigate();
  const fetchTasks = async () => {
    const { data } = await axios({
      method: "GET",
      url: "/tasks/get",
      headers: {
        "Content-Type": "application/json",
      },
    });
    setIssues(data);
  };
  const fetchTask = async (id: number) => {
    const { data } = await axios({
      method: "GET",
      url: `/tasks/get/${id}`,
      headers: {
        "Content-Type": "application/json",
      },
    });
    setDirtyForm(data);
  };
  useEffect(() => {
    fetchTasks();
    fetchFeatures();
  }, []);
  // Called when a new issue is created

  const handleIssueCreated = async (issue: any) => {
    const formattedIssue = {
      ...issue,
      dueDate: new Date(issue.dueDate).toISOString(),
    };
    if (!dirtyForm && !issue?.id) {
      await axios({
        method: "POST",
        url: "/tasks/create",
        data: formattedIssue,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } else {
      await axios({
        method: "PUT",
        url: `/tasks/update/${formattedIssue?.id}`,
        data: formattedIssue,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    fetchTasks();
    handleClose();
  };
  const handleClose = () => {
    setDirtyForm(undefined);
    onClose();
  };
  const handleDelete = async (id: number) => {
    await axios({
      method: "DELETE",
      url: `/tasks/delete/${id}`,
      headers: {
        "Content-Type": "application/json",
      },
    });
    fetchTasks();
    handleClose();
  };
  //Features

  const fetchFeatures = async () => {
    const { data } = await axios({
      method: "GET",
      url: "/features/get",
      headers: {
        "Content-Type": "application/json",
      },
    });
    setFeatures(data);
  };

  const fetchFeature = async (id: number) => {
    const { data } = await axios({
      method: "GET",
      url: `/features/get/${id}`,
      headers: {
        "Content-Type": "application/json",
      },
    });
    setDirtyForm(data);
  };

  const handleFeatureCreated = async (feature: any) => {
    const formattedFeature = {
      ...feature,
      dueDate: new Date(feature.dueDate).toISOString(),
      taskIds: feature.taskIds || [], // ensure taskIds is always an array
    };

    if (!dirtyForm && !feature?.id) {
      await axios({
        method: "POST",
        url: "/features/create",
        data: formattedFeature,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } else {
      await axios({
        method: "PUT",
        url: `/features/update/${formattedFeature?.id}`,
        data: formattedFeature,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    fetchFeatures();
    handleClose();
  };

  const handleFeatureDelete = async (id: number) => {
    await axios({
      method: "DELETE",
      url: `/features/delete/${id}`,
      headers: {
        "Content-Type": "application/json",
      },
    });
    fetchFeatures();
    handleClose();
  };

  // Add state for features
  const handleOpen = (type: IFormType) => {
    setFormType(type);
    onOpen();
  };
  return (
    <>
      <Content>   <Accordion allowMultiple defaultIndex={[]} width="100%">
          {features.map((feature, idx) => (
            <AccordionItem key={idx}>
              <AccordionButton>
                <Box flex="1">
                  <Text fontWeight="bold">{feature.summary}</Text>
                  <Text fontSize="sm" color="gray.600">
                    {feature.priority} | {feature.assignee}
                  </Text>
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel>
                <VStack align="stretch" spacing={2}>
                  {/* Feature details */}
                  <Box 
                    p={4} 
                    borderWidth={1} 
                    borderRadius="md" 
                    bg="blue.50"
                    onClick={() => navigate(`/features/${feature.id}`)}
                    cursor="pointer"
                  >
                    <Text>{feature.description}</Text>
                    <Text fontSize="sm" color="gray.600">
                      Due: {new Date(feature.dueDate).toLocaleDateString()}
                    </Text>
                  </Box>

                  {/* Tasks under this feature */}
                  <Text fontWeight="bold" mt={2}>Tasks:</Text>
                  {issues
                    .filter(task => 
                      feature?.id===task?.featureId
                    )
                    .map((task, taskIdx) => (
                      <Box
                        key={taskIdx}
                        p={3}
                        pl={4}
                        borderWidth={1}
                        borderRadius="md"
                        bg="gray.50"
                        onClick={() => {
                          setDirtyForm({...task, type: 'task'});
                          onOpen();
                        }}
                        cursor="pointer"
                        _hover={{ bg: 'gray.100' }}
                      >
                        <Text fontWeight="semibold">{task.summary}</Text>
                        <HStack spacing={2} mt={1}>
                          <Badge colorScheme={task.priority === 'high' ? 'red' : 'yellow'}>
                            {task.priority}
                          </Badge>
                          <Text fontSize="sm" color="gray.600">
                            {task.assignee}
                          </Text>
                        </HStack>
                      </Box>
                    ))
                  }
                </VStack>
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Add Feature button */}
        <Button
          colorScheme="blue"
          onClick={() => {
            setFormType('feature');
            setDirtyForm(undefined);
            onOpen();
          }}
          mt={4}
        >
          + Add Feature
        </Button>
        <Modal isOpen={isOpen} onClose={handleClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{`${
              !dirtyForm ? "Create New" : "Update"
            } Issue`}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <IssueForm
                existingFormData={dirtyForm}
                onIssueCreated={handleIssueCreated}
                handleDelete={handleDelete}
                handleFeatureCreated={handleFeatureCreated}
                handleFeatureDelete={handleFeatureDelete}
                type={formType}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      </Content>
    </>
  );
};

export default Dashboard;
