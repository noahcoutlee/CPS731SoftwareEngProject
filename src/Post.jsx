function Post({
  title,
  body,
  showEditDeleteButtons,
  showReportButton,
  onEdit,
  onDelete,
  onReport,
}) {
  return (
    <div className="post">
      <h3>{title}</h3>
      <p>{body}</p>
      {showEditDeleteButtons && (
        <div className="post-options">
          <button onClick={onEdit}>Edit</button>
          <button onClick={onDelete}>Delete</button>
        </div>
      )}
      {showReportButton && (
        <button className="report-button" onClick={onReport}>
          Report
        </button>
      )}
    </div>
  );
}

export default Post;
