const ClassCard = ({ data }) => {
  return (
    <div className="bg-indigo-50 p-3 rounded-lg relative">
      <h4 className="font-medium">{data.subject}</h4>
      <p className="text-sm text-gray-500">
        📍 {data.room}
      </p>
/* this section is adding for notification*/
      {data.notify && (
        <span className="absolute top-2 right-2 text-indigo-600">
          🔔
        </span>
      )}
    </div>
  );
};

export default ClassCard;
