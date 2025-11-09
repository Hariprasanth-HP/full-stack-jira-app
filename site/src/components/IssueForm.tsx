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
  useToast,
} from "@chakra-ui/react";

type EntityType = "feature" | "task";

type CommonFormProps = {
  existingData?: any;
  onSave?: (item: any) => void;
  onDelete?: (id: number) => void;
  entityType?: EntityType;
};

const CommonForm = ({
  existingData,
  onSave,
  onDelete,
  entityType = "task",
}: CommonFormProps) => {
  const toast = useToast();
  const isEditing = !!existingData;
  const initialType = (existingData?.type as EntityType) ?? entityType;

  const [form, setForm] = useState({
    type: initialType,
    title: existingData?.summary ?? "",
    details: existingData?.description ?? "",
    priority: (existingData?.priority as "high" | "low") ?? "high",
    assignee: existingData?.assignee ?? "",
    dueDate:
      existingData?.dueDate?.slice?.(0, 10) ??
      new Date().toISOString().split("T")[0],
  } as {
    type: EntityType;
    title: string;
    details: string;
    priority: "high" | "low";
    assignee: string;
    dueDate: string;
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "priority" ? (value as "high" | "low") : value,
    }));
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as EntityType;
    setForm((prev) => ({ ...prev, type: newType }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      type: form.type,
      summary: form.title,
      description: form.details,
      priority: form.priority,
      assignee: form.assignee,
      dueDate: new Date(form.dueDate).toISOString(),
    };
    if (isEditing && existingData?.id) payload.id = existingData.id;
    onSave && onSave(payload);
    toast({
      title: isEditing ? "Updated successfully" : "Created successfully",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Box maxW="800px" maxH={"70vh"} mx="auto" p={6} style={{ overflow: "auto" }}>
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
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Enter title"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Details</FormLabel>
            <Textarea
              name="details"
              value={form.details}
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
            <FormLabel>Assignee</FormLabel>
            <Input
              name="assignee"
              value={form.assignee}
              onChange={handleChange}
              placeholder="Enter assignee"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Due Date</FormLabel>
            <Input name="dueDate" type="date" value={form.dueDate} onChange={handleChange} />
          </FormControl>

          <Button type="submit" colorScheme="blue" size="lg" width="full">
            {isEditing ? "Update" : "Create"}
          </Button>

          {isEditing && onDelete && existingData?.id && (
            <Button colorScheme="red" size="lg" width="full" onClick={() => onDelete(existingData.id)}>
              Delete
            </Button>
          )}
        </VStack>
      </form>
    </Box>
  );
};

export default CommonForm;
// ...existing code...