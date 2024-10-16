const express = require('express');
const router = express.Router();
const verifyToken = require('../controllers/jwtVerification');
const {
  findPosts,
  findComments,
  findUniquePost,
  createPost,
} = require('../controllers/queries');
//BLOG VIEWING

router.get('/', verifyToken, async (req, res, next) => {
  try {
    const blog = await findPosts();

    if (!blog) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const formattedBlogs = blog.map((blog) => ({
      id: blog.id,
      title: blog.title,
      content: blog.content,
      summary: blog.summary,
      author: {
        username: blog.author.username,
        email: blog.author.email,
      },
    }));
    res.json(formattedBlogs);
  } catch (error) {
    next(error); // Pass any error to the error handling middleware
  }
});
router.post('/', verifyToken, async (req, res, next) => {
  const postTitle = req.body.title;
  const postContent = req.body.content;
  const postAuthorId = req.body.userId;
  const postSummary = req.body.summary;
  console.log([postAuthorId, postTitle, postContent]);
  if (!postAuthorId) {
    console.error('Please log in to create a post');
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    await createPost({ postTitle, postContent, postAuthorId, postSummary });
    res.json({
      message: 'Post created',
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:postid', verifyToken, async (req, res, next) => {
  const postid = req.params.postid;
  try {
    const post = await findUniquePost(postid);
    console.log(post);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      title: post.title,
      content: post.content,
      author: {
        username: post.author.username,
        email: post.author.email,
      },
      comments: post.comments,
    });
  } catch (error) {
    next(error); // Pass any error to the error handling middleware
  }
});
router.get('/:postid/comments', async (req, res, next) => {
  try {
    const postid = parseInt(req.params.postid); // Convert postid to an integer
    const comments = await findComments(postid);

    if (comments.length === 0) {
      return res.status(404).json({ error: 'No comments found for this post' });
    }
    const formattedComments = comments.map((comment) => ({
      content: comment.content,
      author: { username: comment.author.username },
    }));
    res.json(formattedComments);
  } catch (error) {
    next(error);
  }
});
router.post('/:postid/comments', async (req, res, next) => {
  const postid = parseInt(req.params.postid);
  const authorId = req.user.id;
  try {
    await prisma.comments.create({
      data: {
        authorId: authorId,
        postid: postid,
        content: req.body.content,
      },
    });
  } catch (err) {
    return next(err);
  }
});

//BLOG CREATION

module.exports = router;
