import { GetStaticProps } from "next";
import Head from "next/head";
import { useContext } from "react";
import Link from "../components/Link";
import Menu from "../components/Menu";
import { TranslateContext } from "../Modules/context";
import { getData } from "./api/theme";

export default function Home() {
  const t = useContext(TranslateContext);
  return (
    <>
      <Menu />
      <Head>
        <title>{t("Privacy Policy")}</title>
      </Head>
      <h1>{t("Privacy Policy")}</h1>
      <p>{t("This privacy policy is only available in english. ")}</p>
      <p>
        At Open Source Fantasy Manager, accessible from this website, one of our
        main priorities is the privacy of our visitors. This Privacy Policy
        document contains types of information that is collected and recorded by
        Open Source Fantasy Manager and how we use it.
      </p>
      <p>
        If you have additional questions or require more information about our
        Privacy Policy, do not hesitate to contact us.
      </p>
      <h2>Log Files</h2>
      <p>
        Open Source Fantasy Manager follows a standard procedure of using log
        files. These files log visitors when they visit websites. All hosting
        companies do this and a part of hosting services&apos; analytics. The
        information collected by log files include internet protocol (IP)
        addresses, browser type, Internet Service Provider (ISP), date and time
        stamp, and gameplay actions(transfers, purchases, etc). The purpose of
        the information is for analyzing trends, administering the site, and
        tracking users&apos; movement on the website. Our Privacy Policy was
        created with the help of the{" "}
        <Link href="https://www.privacypolicygenerator.org">
          Privacy Policy Generator
        </Link>
        .
      </p>
      <h2>Cookies and Web Beacons</h2>
      <p>
        Like any other website, Open Source Fantasy Manager uses
        &apos;cookies&apos;. These cookies are used to store information
        including visitors&apos; preferences, and the pages on the website that
        the visitor accessed or visited. The information is used to optimize the
        users&apos; experience by customizing our web page content based on
        visitors&apos; browser type and/or other information.
      </p>
      <h2>Third Party Privacy Policies</h2>
      <p>
        Open Source Fantasy Manager&apos;s Privacy Policy does not apply to
        other advertisers or websites. Thus, we are advising you to consult the
        respective Privacy Policies of these third-party ad servers for more
        detailed information. It may include their practices and instructions
        about how to opt-out of certain options.
      </p>
      <p>
        You can choose to disable cookies through your individual browser
        options. To know more detailed information about cookie management with
        specific web browsers, it can be found at the browsers&apos; respective
        websites.
      </p>
      <h2>Children&apos;s Information</h2>
      <p>
        Another part of our priority is adding protection for children while
        using the internet. We encourage parents and guardians to observe,
        participate in, and/or monitor and guide their online activity.
      </p>
      <p>
        Open Source Fantasy Manager does not knowingly collect any Personal
        Identifiable Information from children under the age of 13. If you think
        that your child provided this kind of information on our website, we
        strongly encourage you to contact us immediately and we will do our best
        efforts to promptly remove such information from our records.
      </p>
      <h2>Online Privacy Policy Only</h2>
      <p>
        This Privacy Policy applies only to our online activities and is valid
        for visitors to our website with regards to the information that they
        shared and/or collect in Open Source Fantasy Manager. This policy is not
        applicable to any information collected offline or via channels other
        than this website.
      </p>
      <h2>Consent</h2>
      <p>
        By using an account, you hereby consent to our Privacy Policy and agree
        to its Terms and Conditions.
      </p>
    </>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  return {
    props: { t: await getData(context) },
  };
};
