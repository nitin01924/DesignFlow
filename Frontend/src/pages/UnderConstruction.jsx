import video from "../assets/under-construction.mp4";

function UnderConstruction() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center  text-black">
      <video
        src={video}
        autoPlay
        loop
        muted
        playsInline
        className="w-[500px] rounded-lg"
      />

      <h1 className="text-3xl font-bold mt-6">
        DesignFlow is under construction
      </h1>

      <p className="text-gray-400 mt-2">
        New features will comming soon.
      </p>
    </div>
  );
}

export default UnderConstruction;
