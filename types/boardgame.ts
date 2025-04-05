export interface Boardgame {
    type: string;
    id: string;
    thumbnail?: string;
    image?: string;
    name?: {
        type: string;
        value: string;
    }[];
    description?: string;
    yearpublished?: string;
    statistics?: {
    ratings?: {
        usersrated?: string;
        average?: string;
        bayesaverage?: string;
        stddev?: string;
        median?: string;
        owned?: string;
        trading?: string;
        wanting?: string;
        wishing?: string;
        numcomments?: string;
        numweights?: string;
        averageweight?: string;
    };
    };
}