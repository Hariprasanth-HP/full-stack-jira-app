import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Spinner,
} from "@chakra-ui/react";
import axios from "axios";
import IssueForm from "./IssueForm";
import type { IFormType } from "@/pages/Dashboard";

interface FeatureData {
  id: number;
  type: string;
  summary: string;
  description: string;
  priority: string;
  assignee: string;
  dueDate: string;
  taskIds: string[]; // stored as array of strings
}

const Feature = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [feature, setFeature] = useState<FeatureData | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formType, setFormType] = useState<IFormType>("task"); // controls IssueForm type

  const fetchAllTasksofFeature = async () => {
    try {
      const { data } = await axios.get(`/tasks/get/feature/${id}`, {
        headers: { "Content-Type": "application/json" },
      });
      setTasks(data);
    } catch (e) {
      console.error("fetchAllTasks error", e);
    }
  };

  const fetchFeature = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`/features/get/${id}`);
      setFeature(data);
      fetchAllTasksofFeature();
    } catch (error) {
      console.error("Error fetching feature:", error);
      setFeature(null);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeature();
    fetchAllTasksofFeature();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // open modal for editing feature or creating task
  const handleOpen = (type: IFormType) => {
    setFormType(type);
    onOpen();
  };

  // update feature handler (used when editing feature)
  const handleUpdateFeature = async (updatedFeature: any) => {
    try {
      const payload = {
        ...updatedFeature,
        dueDate: updatedFeature.dueDate
          ? new Date(updatedFeature.dueDate).toISOString()
          : null,
      };
      await axios.put(`/features/update/${id}`, payload, {
        headers: { "Content-Type": "application/json" },
      });
      await fetchFeature();
      onClose();
    } catch (error) {
      console.error("Error updating feature:", error);
    }
  };

  // create task handler (used when creating a new task from feature page)
  // Optionally associate task to this feature by updating feature.taskIds after creation
  const handleCreateTask = async (task: any) => {
    try {
      const payload = {
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
        featureId: id,
      };
      await axios.post("/tasks/create", payload, {
        headers: { "Content-Type": "application/json" },
      });
      // refresh data
      await fetchFeature();
      await fetchAllTasksofFeature();
      onClose();
    } catch (err) {
      console.error("Error creating task:", err);
    }
  };

  const handleDelete = async () => {
    await axios.delete(`/features/delete/${id}`, {
      headers: { "Content-Type": "application/json" },
    });
    navigate("/");
  };

  if (loading) return <Spinner size="xl" />;
  if (!feature) return <Text>Feature not found</Text>;

  return (
    <Container maxW="container.lg" py={8}>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg">{feature.summary}</Heading>
        <HStack>
          <Button colorScheme="blue" onClick={() => handleOpen("feature")}>
            Edit Feature
          </Button>
          <Button colorScheme="red" onClick={() => handleDelete("feature")}>
            Delete Feature
          </Button>
          <Button colorScheme="green" onClick={() => handleOpen("task")}>
            Add Task
          </Button>
        </HStack>
      </HStack>

      <VStack align="stretch" spacing={6}>
        <Box p={4} borderWidth={1} borderRadius="md">
          <VStack align="stretch" spacing={3}>
            <HStack>
              <Badge
                colorScheme={feature.priority === "high" ? "red" : "yellow"}
              >
                {feature.priority}
              </Badge>
              <Text color="gray.500">Assigned to: {feature.assignee}</Text>
            </HStack>
            <Text>{feature.description}</Text>
            <Text color="gray.500">
              Due: {new Date(feature.dueDate).toLocaleDateString()}
            </Text>
          </VStack>
        </Box>

        <Box>
          <Heading size="md" mb={4}>
            Tasks
          </Heading>
          <VStack align="stretch" spacing={3}>
            {tasks.length === 0 ? (
              <Text color="gray.500">No tasks assigned to this feature</Text>
            ) : (
              tasks.map((task) => (
                <Box
                  key={task.id}
                  p={3}
                  borderWidth={1}
                  borderRadius="md"
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  cursor="pointer"
                  _hover={{ bg: "gray.50" }}
                >
                  <Text fontWeight="bold">{task.summary}</Text>
                  <HStack>
                    <Badge>{task.priority}</Badge>
                    <Text fontSize="sm" color="gray.500">
                      Assigned to: {task.assignee}
                    </Text>
                  </HStack>
                </Box>
              ))
            )}
          </VStack>
        </Box>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {formType === "feature" ? "Edit Feature" : "Create Task"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <IssueForm
              existingData={formType === "feature" ? feature : undefined}
              onSave={
                formType === "feature" ? handleUpdateFeature : handleCreateTask
              }
              entityType={formType}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default Feature;
