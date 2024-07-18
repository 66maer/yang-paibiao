import DateTag from "@/components/DateTag";
const Canvas = () => {
  const timestamp = new Date();
  timestamp.setDate(timestamp.getDate() + 1);

  return (
    <>
      <DateTag date={timestamp.getTime()} />
    </>
  );
};

export default Canvas;
