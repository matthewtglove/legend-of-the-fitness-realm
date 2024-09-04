import { useRef, useState } from 'react';
import { AsyncButton, Button } from './buttons';
import { useStableCallback } from './use-stable-callback';
import { ExpandableView } from './expandable-view';

export const KeepAwake = () => {
    const [log, setLog] = useState([] as { message: string; kind: `log` | `error` }[]);
    const [wakeLock, setWakeLock] = useState(undefined as undefined | WakeLockSentinel);

    const obtainWakeLock = async () => {
        try {
            // wake lock api
            const wakeLock = await navigator.wakeLock.request(`screen`);
            setLog((s) => [...s, { kind: `log`, message: `wakeLock: ${wakeLock?.type}` }]);
            setWakeLock(wakeLock);

            const onRelease = () => {
                setLog((s) => [...s, { kind: `log`, message: `wakeLock released` }]);
                setWakeLock(undefined);
                wakeLock.removeEventListener(`release`, onRelease);
            };

            wakeLock.addEventListener(`release`, onRelease);
        } catch (e) {
            setLog((s) => [...s, { kind: `error`, message: `${(e as { message?: string })?.message ?? ``}: ${e}` }]);
        }
    };

    const videoHostRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef(undefined as undefined | HTMLVideoElement);
    const [videoTimeoutId, setVideoTimeoutId] = useState(undefined as undefined | ReturnType<typeof setTimeout>);
    const playVideo = useStableCallback(async () => {
        if (!videoTimeoutId) {
            setLog((s) => [...s, { kind: `error`, message: `playVideo - error: video was cancelled` }]);
            return;
        }
        clearTimeout(videoTimeoutId);
        setVideoTimeoutId(undefined);

        const video = videoRef.current;
        if (!video) {
            setLog((s) => [...s, { kind: `error`, message: `playVideo - error: video does not exist` }]);
            return;
        }

        try {
            // periodic video
            setLog((s) => [...s, { kind: `log`, message: `video playing...` }]);

            videoHostRef.current?.scrollIntoView();
            video.currentTime = 0;
            await video.play();
            setLog((s) => [...s, { kind: `log`, message: `video started` }]);

            setTimeout(() => {
                // pause video
                video.pause();

                // // test: remove and re-add video to reset it?
                // video.remove();
                // videoRef.current = undefined;

                setLog((s) => [...s, { kind: `log`, message: `video stopped` }]);
                startVideoAfterTime();
            }, 3000);
        } catch (e) {
            setLog((s) => [
                ...s,
                { kind: `error`, message: `playVideo - error: ${(e as { message?: string })?.message ?? ``}: ${e}` },
            ]);
        }
    });

    const createAndPauseVideo = useStableCallback((inline?: boolean) => {
        // create video if not exists
        if (!videoRef.current) {
            setLog((s) => [...s, { kind: `log`, message: `video creating...` }]);
            const video = document.createElement(`video`);
            videoRef.current = video;
            video.src = `https://www.w3schools.com/html/mov_bbb.mp4`;
            video.autoplay = false;
            video.loop = true;
            video.muted = true;
            if (inline !== undefined) {
                video.playsInline = inline;
            }
            videoHostRef.current?.appendChild(video);
            videoHostRef.current?.scrollIntoView();
            video.play().then(() => video.pause());

            setLog((s) => [...s, { kind: `log`, message: `video created` }]);
        }
    });

    const removeVideo = useStableCallback(() => {
        setLog((s) => [...s, { kind: `log`, message: `video removing...` }]);
        videoRef.current?.pause();
        videoRef.current?.remove();
        setLog((s) => [...s, { kind: `log`, message: `video removed` }]);
    });

    const startVideoAfterTime = useStableCallback(() => {
        createAndPauseVideo();

        const TIME = 15 * 1000;
        setLog((s) => [...s, { kind: `log`, message: `video will start in ${TIME}ms` }]);
        setVideoTimeoutId(setTimeout(playVideo, TIME));
    });

    const stopVideoTimeout = useStableCallback(() => {
        setLog((s) => [...s, { kind: `log`, message: `video cancelling...` }]);

        videoRef.current?.pause();
        videoRef.current?.remove();

        clearTimeout(videoTimeoutId);
        setVideoTimeoutId(undefined);

        setLog((s) => [...s, { kind: `log`, message: `video cancelled` }]);
    });

    return (
        <div className="flex flex-col gap-2 my-2">
            <div className="flex flex-row flex-wrap gap-2">
                <AsyncButton
                    text={`Obtain Wake Lock`}
                    action={obtainWakeLock}
                    onDone={() => {
                        // ignore
                    }}
                    disabled={!!wakeLock}
                />
                <Button
                    text={`${!videoTimeoutId ? `Play` : `Stop`} Periodic Video`}
                    onClick={() => (!videoTimeoutId ? startVideoAfterTime() : stopVideoTimeout())}
                />
                <Button text={`Create and pause video (unset)`} onClick={() => createAndPauseVideo(undefined)} />
                <Button text={`Create and pause video (inline=true)`} onClick={() => createAndPauseVideo(true)} />
                <Button text={`Create and pause video (inline=false)`} onClick={() => createAndPauseVideo(false)} />
                <Button text={`Remove video`} onClick={removeVideo} />
            </div>
            <ExpandableView mode="exclude" title="Log" expanded={true}>
                <div>
                    {log.map((l, i) => (
                        <div key={i} className={l.kind === `error` ? `text-red-400` : ``}>
                            {l.message}
                        </div>
                    ))}
                </div>
            </ExpandableView>
            <div ref={videoHostRef} />
        </div>
    );
};
