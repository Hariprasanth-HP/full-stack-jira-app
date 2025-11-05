import React, { useState } from 'react';
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
} from '@chakra-ui/react';

function generateUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const IssueForm = ({
  existingFormData,
  onIssueCreated,
}: {
  existingFormData?: any;
  onIssueCreated?: (issue: any) => void;
}) => {
  const toast = useToast();
  const isEditing = existingFormData !== undefined;
  const [form, setForm] = useState(
    existingFormData ?? {
      type: "story",
      summary: "Summaru",
      description: "Description",
      priority: "highest",
      assignee: "Hari",
      dueDate: new Date().toISOString().split('T')[0],
    }
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Issue created successfully!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      if (onIssueCreated) {
        const issueWithId = { ...form, id: generateUUID() };
        onIssueCreated(issueWithId);
      }
    }, 500);
  };

  return (
    <Box maxW="800px" maxH={'70vh'} style={{
        overflow:'auto'
    }} mx="auto" p={6}>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          <FormControl isRequired>
            <FormLabel>Issue Type</FormLabel>
            <Select
              name="type"
              value={form.type}
              onChange={handleChange}
              placeholder="Select issue type"
            >
              <option value="story">Story</option>
            </Select>
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Summary</FormLabel>
            <Input
              name="summary"
              value={form.summary}
              onChange={handleChange}
              placeholder="Brief summary of the issue"
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Description</FormLabel>
            <Textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Detailed description of the issue"
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
              <option value="highest">Highest</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="lowest">Lowest</option>
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel>Assignee</FormLabel>
            <Input
              name="assignee"
              value={form.assignee}
              onChange={handleChange}
              placeholder="Assign to"
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
          <Button type="submit" colorScheme="blue" size="lg" width="full">
            {isEditing?'Update issue':'Create Issue'}
          </Button>
        </VStack>
      </form>
    </Box>
  );
};

export default IssueForm;