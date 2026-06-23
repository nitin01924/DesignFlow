import video from "../assets/under-construction.mp4";

function UnderConstruction() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center text-black">
      <video
        src={video}
        autoPlay
        loop
        muted
        playsInline
        className="w-full max-w-xs rounded-lg sm:max-w-md lg:max-w-xl"
      />

      <h1 className="mt-6 text-2xl font-bold sm:text-3xl">
        DesignFlow is under construction
      </h1>

      <p className="mt-2 text-gray-400">New features will comming soon.</p>
    </div>
  );
}

export default UnderConstruction;
