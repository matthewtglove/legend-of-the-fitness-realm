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

    const [videoTimeoutId, setVideoTimeoutId] = useState(undefined as undefined | ReturnType<typeof setTimeout>);
    const playVideo = useStableCallback(async () => {
        if (!videoTimeoutId) {
            return;
        }
        clearTimeout(videoTimeoutId);
        setVideoTimeoutId(undefined);

        try {
            // periodic video
            setLog((s) => [...s, { kind: `log`, message: `video creating...` }]);

            const video = document.createElement(`video`);
            video.src = `https://www.w3schools.com/html/mov_bbb.mp4`;
            video.autoplay = true;
            video.loop = true;
            video.muted = true;
            setLog((s) => [...s, { kind: `log`, message: `video playing...` }]);

            await video.play();
            setLog((s) => [...s, { kind: `log`, message: `video started` }]);

            videoHostRef.current?.appendChild(video);
            videoHostRef.current?.scrollIntoView();
            setTimeout(() => {
                // stop video
                video.pause();

                // remove video
                video.remove();
                setLog((s) => [...s, { kind: `log`, message: `video stopped` }]);
                startVideoAfterTime();
            }, 3000);
        } catch (e) {
            setLog((s) => [...s, { kind: `error`, message: `${(e as { message?: string })?.message ?? ``}: ${e}` }]);
        }
    });

    const startVideoAfterTime = useStableCallback(() => {
        const TIME = 15 * 1000;
        setLog((s) => [...s, { kind: `log`, message: `video will start in ${TIME}ms` }]);
        setVideoTimeoutId(setTimeout(playVideo, TIME));
    });

    const stopVideoTimeout = useStableCallback(() => {
        setLog((s) => [...s, { kind: `log`, message: `video cancelled` }]);
        clearTimeout(videoTimeoutId);
        setVideoTimeoutId(undefined);
    });

    const videoHostRef = useRef<HTMLDivElement>(null);

    return (
        <div className="flex flex-col gap-2 my-2">
            <div className="flex flex-row gap-2">
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
