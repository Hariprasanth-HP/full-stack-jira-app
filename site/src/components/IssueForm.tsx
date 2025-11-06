import React, { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  VStack,
  Text,
  useToast,
} from "@chakra-ui/react";

type IssueFormProps = {
  existingFormData?: any;
  onIssueCreated?: (issue: any) => void;
  handleFeatureCreated?: (issue: any) => void;
  handleDelete?: (id: number) => void;
  handleFeatureDelete?: (id: number) => void;
  type?: "feature" | "task";
};

const IssueForm = ({
  existingFormData,
  onIssueCreated,
  handleDelete,
  type = "task",
  handleFeatureCreated,
  handleFeatureDelete,
}: IssueFormProps) => {
  const toast = useToast();
  const isEditing = existingFormData !== undefined;

  const initialType = existingFormData?.type ?? type;

  const [form, setForm] = useState({
    type: initialType,
    summary: existingFormData?.summary ?? "",
    description: existingFormData?.description ?? "",
    priority: existingFormData?.priority ?? "high",
    assignee: existingFormData?.assignee ?? "",
    dueDate:
      existingFormData?.dueDate?.slice?.(0, 10) ??
      new Date().toISOString().split("T")[0],
    // taskIds only present when feature
    taskIds:
      initialType === "feature"
        ? Array.isArray(existingFormData?.taskIds)
          ? existingFormData.taskIds
          : []
        : undefined,
  } as {
    type: "feature" | "task";
    summary: string;
    description: string;
    priority: "high" | "low";
    assignee: string;
    dueDate: string;
    taskIds?: number[];
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      // keep priority type
      [name]: name === "priority" ? (value as "high" | "low") : value,
    }));
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as "feature" | "task";
    setForm((prev) => {
      if (newType === "feature") {
        return { ...prev, type: newType, taskIds: prev.taskIds ?? [] };
      } else {
        // remove taskIds for tasks
        const { taskIds, ...rest } = prev;
        return { ...rest, type: newType } as any;
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // prepare payload matching backend field names
    const payload: any = {
      type: form.type,
      summary: form.summary,
      description: form.description,
      priority: form.priority,
      assignee: form.assignee,
      dueDate: new Date(form.dueDate).toISOString(),
    };

    if (type === "feature") {
      payload.taskIds = form.taskIds ?? [];
    } 
      if (onIssueCreated) onIssueCreated(payload);

    // simulate or call API

    toast({
      title: isEditing ? "Updated successfully" : "Created successfully",
      status: "success",
      duration: 2500,
      isClosable: true,
    });
  };

  return (
    <Box
      maxW="800px"
      maxH={"70vh"}
      style={{
        overflow: "auto",
      }}
      mx="auto"
      p={6}
    >
      <form onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          <FormControl isRequired>
            <FormLabel>Type</FormLabel>
            <Select name="type" value={form.type} onChange={handleTypeChange}>
              <option value="feature">Feature</option>
              <option value="task">Task</option>
            </Select>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Title</FormLabel>
            <Input
              name="summary"
              value={form.summary}
              onChange={handleChange}
              placeholder="Enter title"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Details</FormLabel>
            <Textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter details"
              minH="120px"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Priority</FormLabel>
            <Select
              name="priority"
              value={form.priority}
              onChange={handleChange}
              placeholder="Select priority"
            >
              <option value="high">High</option>
              <option value="low">Low</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Assigned To</FormLabel>
            <Input
              name="assignee"
              value={form.assignee}
              onChange={handleChange}
              placeholder="Enter assignee"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Due Date</FormLabel>
            <Input
              name="dueDate"
              type="date"
              value={form.dueDate}
              onChange={handleChange}
            />
          </FormControl>

          {/* show taskIds only for features, start empty for new features */}
          {form.type === "feature" && (
            <FormControl>
              <FormLabel>Task IDs</FormLabel>
              <Text color="gray.600">
                {Array.isArray(form.taskIds) && form.taskIds.length > 0
                  ? form.taskIds.join(", ")
                  : "No tasks assigned"}
              </Text>
            </FormControl>
          )}

          <Button type="submit" colorScheme="blue" size="lg" width="full">
            {isEditing ? "Update" : "Create"}
          </Button>

          {isEditing && (
            <Button
              colorScheme="red"
              size="lg"
              width="full"
              onClick={() => {
                if (type === "feature"&&handleFeatureDelete) {
                    handleFeatureDelete(existingFormData?.id);
                } else {
                   if (handleDelete)
                    handleDelete(existingFormData?.id);
                }
              }}
            >
              Delete
            </Button>
          )}
        </VStack>
      </form>
    </Box>
  );
};

export default IssueForm;
