import allowOrigins from "./allowed-origins"


const corsOptions = {
    origin: (origin: string | undefined, callback: Function) => {

        if ((origin && allowOrigins?.includes(origin)) || !origin)
            callback(null, true);
        else
            callback(new Error("\n\n Origin Not Allowed by Cors"))
    },
    credentials: true,
    optionSuccessStatus: 200,
};

export default corsOptions;
