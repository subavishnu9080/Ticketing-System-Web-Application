const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const Comment = require('../models/Comment');
const { protect, authorize } = require('../middleware/auth');
const { OpenAI } = require('openai');

// Initialize OpenAI client if API key is provided
let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Local keyword-based fallback suggestion engine
const suggestMetadata = async (description) => {
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an automated helpdesk classifier. Based on the user's ticket description, suggest the most appropriate ticket Category (e.g. Hardware, Software, Network, Access & Security, Database, Billing, General) and Priority (low, medium, high). Return ONLY a JSON object: {\"category\": \"CategoryName\", \"priority\": \"low/medium/high\"}."
          },
          {
            role: "user",
            content: description
          }
        ],
        temperature: 0.2
      });
      const data = JSON.parse(response.choices[0].message.content.trim());
      return data;
    } catch (e) {
      console.error("OpenAI suggestion error, falling back to local heuristic:", e.message);
    }
  }

  const text = (description || '').toLowerCase();
  let priority = 'medium';
  let category = 'General';

  if (
    text.includes('crash') || 
    text.includes('down') || 
    text.includes('critical') || 
    text.includes('broken') || 
    text.includes('urgent') || 
    text.includes('unable to login') || 
    text.includes('security breach')
  ) {
    priority = 'high';
  } else if (
    text.includes('minor') || 
    text.includes('question') || 
    text.includes('documentation') || 
    text.includes('how do i') || 
    text.includes('suggestion')
  ) {
    priority = 'low';
  }

  if (text.includes('password') || text.includes('login') || text.includes('access') || text.includes('permission')) {
    category = 'Access & Security';
  } else if (text.includes('internet') || text.includes('wifi') || text.includes('network') || text.includes('connection')) {
    category = 'Network';
  } else if (text.includes('laptop') || text.includes('monitor') || text.includes('keyboard') || text.includes('hardware') || text.includes('printer')) {
    category = 'Hardware';
  } else if (text.includes('error') || text.includes('bug') || text.includes('software') || text.includes('app') || text.includes('crash')) {
    category = 'Software';
  } else if (text.includes('billing') || text.includes('payment') || text.includes('invoice') || text.includes('charge')) {
    category = 'Billing';
  } else if (text.includes('database') || text.includes('db') || text.includes('query') || text.includes('sql')) {
    category = 'Database';
  }

  return { priority, category };
};

// @route   POST api/tickets/suggest
// @desc    Suggest category and priority from description using AI or rules
// @access  Protected
router.post('/suggest', protect, async (req, res) => {
  const { description } = req.body;
  if (!description) {
    return res.status(400).json({ message: 'Description is required for auto-suggestion' });
  }
  try {
    const suggestion = await suggestMetadata(description);
    res.json(suggestion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET api/tickets
// @desc    Fetch all tickets with filtering and search
// @access  Protected
router.get('/', protect, async (req, res) => {
  try {
    const { status, priority, assignee, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) {
      filter.assignee = assignee === 'unassigned' ? null : assignee;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Standard access rules: 
    // - Customers (role: user) can only see tickets they created
    // - Admins and Agents can see all tickets
    if (req.user.role === 'user') {
      filter.createdBy = req.user._id;
    }

    const tickets = await Ticket.find(filter)
      .populate('assignee', 'username role')
      .populate('createdBy', 'username role')
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET api/tickets/:id
// @desc    Fetch a single ticket details along with comment timeline
// @access  Protected
router.get('/:id', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('assignee', 'username role')
      .populate('createdBy', 'username role');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Role verification: User role can only view their own tickets
    if (req.user.role === 'user' && ticket.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this ticket' });
    }

    const comments = await Comment.find({ ticketId: ticket._id })
      .populate('author', 'username role')
      .sort({ created_at: 1 });

    res.json({ ticket, comments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST api/tickets
// @desc    Create a new ticket
// @access  Protected
router.post('/', protect, async (req, res) => {
  const { title, description, priority, category } = req.body;
  try {
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const ticket = await Ticket.create({
      title,
      description,
      priority: priority || 'medium',
      category: category || 'General',
      createdBy: req.user._id
    });

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('assignee', 'username role')
      .populate('createdBy', 'username role');

    res.status(201).json(populatedTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT api/tickets/:id
// @desc    Update ticket status, priority, category or assignee
// @access  Protected (Agents & Admins can change status/priority/assignee; Users can update description/title only if open)
router.put('/:id', protect, async (req, res) => {
  try {
    let ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const { title, description, status, priority, category, assignee } = req.body;
    const isAgentOrAdmin = req.user.role === 'agent' || req.user.role === 'admin';

    // Access control
    if (!isAgentOrAdmin) {
      // Regular user can only modify their own tickets
      if (ticket.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this ticket' });
      }
      // Regular users cannot modify assignee or status/priority directly once submitted
      if (status || priority || assignee) {
        return res.status(403).json({ message: 'Users cannot update ticket status, priority, or assignees' });
      }
    }

    // Apply updates
    if (title) ticket.title = title;
    if (description) ticket.description = description;
    if (category) ticket.category = category;

    if (isAgentOrAdmin) {
      if (status) ticket.status = status;
      if (priority) ticket.priority = priority;
      if (assignee !== undefined) {
        ticket.assignee = assignee === 'unassigned' || !assignee ? null : assignee;
      }
    }

    await ticket.save();

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('assignee', 'username role')
      .populate('createdBy', 'username role');

    res.json(updatedTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE api/tickets/:id
// @desc    Delete a ticket
// @access  Protected (Admins only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    await Ticket.findByIdAndDelete(req.params.id);
    await Comment.deleteMany({ ticketId: req.params.id });

    res.json({ message: 'Ticket and associated comments deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST api/tickets/:id/comments
// @desc    Add a comment/activity history update to a ticket
// @access  Protected
router.post('/:id/comments', protect, async (req, res) => {
  const { comment } = req.body;
  try {
    if (!comment) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Regular users can only comment on their own tickets
    if (req.user.role === 'user' && ticket.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to comment on this ticket' });
    }

    const commentDoc = await Comment.create({
      ticketId: ticket._id,
      comment,
      author: req.user._id
    });

    const populatedComment = await Comment.findById(commentDoc._id)
      .populate('author', 'username role');

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
