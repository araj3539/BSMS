// src/components/ReviewList.jsx
import React, { useState } from 'react';
import RatingStars from './RatingStars';
import api from '../services/api';
import { toast } from 'react-hot-toast';

// Sub-component for individual review logic
function ReviewItem({ review, user, bookId, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  
  // Edit State
  const [editRating, setEditRating] = useState(review.rating);
  const [editComment, setEditComment] = useState(review.comment);
  
  // Reply State
  const [replyComment, setReplyComment] = useState('');

  // --- ACTIONS ---

  async function handleDelete() {
    if (!confirm('Delete this review?')) return;
    try {
      await api.delete(`/books/${bookId}/reviews/${review._id}`);
      toast.success('Review deleted');
      onUpdate();
    } catch (err) {
      toast.error('Failed to delete');
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    try {
      await api.put(`/books/${bookId}/reviews/${review._id}`, {
        rating: editRating,
        comment: editComment
      });
      toast.success('Review updated');
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      toast.error('Failed to update');
    }
  }

  async function handleReplySubmit(e) {
    e.preventDefault();
    if(!replyComment.trim()) return;
    try {
      await api.post(`/books/${bookId}/reviews/${review._id}/replies`, {
        comment: replyComment
      });
      toast.success('Reply added');
      setIsReplying(false);
      setReplyComment('');
      onUpdate();
    } catch (err) {
      toast.error('Failed to reply');
    }
  }

  // Check ownership
  const isOwner = user && user._id === review.user;
  const isAdmin = user && user.role === 'admin';
  const canDelete = isOwner || isAdmin;

  return (
    <div className="border-b pb-4 mb-4 last:border-0">
      {/* --- VIEW MODE --- */}
      {!isEditing ? (
        <>
          <div className="flex items-center justify-between">
            <div className="font-semibold">{review.name}</div>
            <RatingStars rating={review.rating} />
          </div>
          <div className="text-xs text-gray-400 mb-2">
            {new Date(review.createdAt).toLocaleDateString()}
          </div>
          <p className="text-gray-700 text-sm">{review.comment}</p>

          {/* Action Buttons */}
          <div className="mt-2 flex gap-3 text-xs">
            {user && (
              <button onClick={() => setIsReplying(!isReplying)} className="text-blue-600 hover:underline">
                Reply
              </button>
            )}
            {isOwner && (
              <button onClick={() => setIsEditing(true)} className="text-yellow-600 hover:underline">
                Edit
              </button>
            )}
            {canDelete && (
              <button onClick={handleDelete} className="text-red-600 hover:underline">
                Delete
              </button>
            )}
          </div>
        </>
      ) : (
        // --- EDIT MODE ---
        <form onSubmit={handleEditSubmit} className="bg-gray-50 p-3 rounded">
          <div className="mb-2">
            <label className="text-xs font-bold">Rating</label>
            <select 
              value={editRating} 
              onChange={e => setEditRating(Number(e.target.value))}
              className="block w-full border p-1 rounded text-sm"
            >
              {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Stars</option>)}
            </select>
          </div>
          <textarea 
            value={editComment} 
            onChange={e => setEditComment(e.target.value)} 
            className="w-full border p-2 rounded text-sm" 
            rows="2"
          />
          <div className="mt-2 flex gap-2">
            <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs">Save</button>
            <button type="button" onClick={() => setIsEditing(false)} className="text-gray-500 text-xs">Cancel</button>
          </div>
        </form>
      )}

      {/* --- REPLY FORM --- */}
      {isReplying && (
        <form onSubmit={handleReplySubmit} className="mt-3 ml-4">
          <textarea 
            value={replyComment} 
            onChange={e => setReplyComment(e.target.value)}
            placeholder="Write a reply..."
            className="w-full border p-2 rounded text-sm"
            rows="2"
          />
          <div className="mt-1 flex gap-2">
            <button className="bg-gray-800 text-white px-3 py-1 rounded text-xs">Post Reply</button>
            <button type="button" onClick={() => setIsReplying(false)} className="text-gray-500 text-xs">Cancel</button>
          </div>
        </form>
      )}

      {/* --- REPLIES LIST --- */}
      {review.replies && review.replies.length > 0 && (
        <div className="mt-3 ml-4 space-y-2 border-l-2 pl-3 border-gray-100">
          {review.replies.map((rep, idx) => (
            <div key={idx} className="bg-gray-50 p-2 rounded">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-700">{rep.name}</span>
                <span className="text-[10px] text-gray-400">{new Date(rep.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">{rep.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Main List Component
export default function ReviewList({ reviews, user, bookId, onUpdate }) {
  if (!reviews || reviews.length === 0) {
    return <div className="text-gray-500 mt-4">No reviews yet. Be the first!</div>;
  }

  return (
    <div className="space-y-4 mt-4">
      {reviews.map((review) => (
        <ReviewItem 
          key={review._id} 
          review={review} 
          user={user} 
          bookId={bookId} 
          onUpdate={onUpdate} 
        />
      ))}
    </div>
  );
}